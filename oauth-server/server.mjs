#!/usr/bin/env node
/**
 * OAuth relay for the GetDone Raycast extension.
 *
 * Notion's token exchange authenticates with the integration's client secret,
 * and a Raycast extension is JavaScript on the user's machine — anything
 * bundled into it is readable. So the exchange has to happen somewhere we
 * control. This is that somewhere, and it is the only component that ever sees
 * the secret.
 *
 * Three endpoints:
 *   GET  /api/authorize     → sends the browser to Notion, with our callback
 *   GET  /api/code          → catches Notion's callback, hands the code to Raycast
 *   POST /api/access-token  → swaps the code for a token using the secret
 *
 * Run behind a TLS-terminating reverse proxy. Notion requires an HTTPS
 * redirect URI, and the secret should never travel over plaintext.
 */
import http from 'node:http'
import {
  basicAuth,
  buildNotionAuthorizeUrl,
  buildRaycastRedirect,
  decodeState,
  encodeState,
  isAllowedRedirect,
} from './lib.mjs'

const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token'
const MAX_BODY_BYTES = 8 * 1024

const config = {
  clientId: process.env.NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? '127.0.0.1',
}

// Fail at boot rather than on a user's first sign-in attempt.
for (const key of ['clientId', 'clientSecret', 'publicBaseUrl']) {
  if (!config[key]) {
    console.error(
      `Missing required environment variable for "${key}". See .env.example.`
    )
    process.exit(1)
  }
}

const callbackUrl = new URL('/api/code', config.publicBaseUrl).toString()

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(status, {
    'content-type':
      typeof body === 'string'
        ? 'text/plain; charset=utf-8'
        : 'application/json',
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(payload)
}

const redirect = (res, location) => {
  res.writeHead(302, { location, 'cache-control': 'no-store' })
  res.end()
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

/** Step 1: hand the browser to Notion, remembering where Raycast wants the code. */
function handleAuthorize(url, res) {
  const raycastRedirect = url.searchParams.get('redirect_uri') ?? ''

  // Reject early rather than discovering at the callback that we cannot
  // safely deliver the code anywhere.
  if (!isAllowedRedirect(raycastRedirect)) {
    return send(res, 400, { error: 'unsupported redirect_uri' })
  }

  const state = encodeState({
    raycastState: url.searchParams.get('state') ?? '',
    raycastRedirect,
  })

  redirect(
    res,
    buildNotionAuthorizeUrl({
      clientId: config.clientId,
      callbackUrl,
      state,
    })
  )
}

/** Step 2: Notion sends the user back here; forward the code to Raycast. */
function handleCode(url, res) {
  const denied = url.searchParams.get('error')
  if (denied) {
    return send(res, 200, `Notion authorization was cancelled (${denied}).`)
  }

  const code = url.searchParams.get('code')
  if (!code) return send(res, 400, { error: 'missing code' })

  const state = decodeState(url.searchParams.get('state') ?? '')
  if (!state) return send(res, 400, { error: 'invalid state' })

  // `state` came off the network, so its redirect is untrusted until checked.
  if (!isAllowedRedirect(state.raycastRedirect)) {
    return send(res, 400, { error: 'unsupported redirect target' })
  }

  redirect(res, buildRaycastRedirect({ ...state, code }))
}

/** Step 3: the extension posts the code here; only this step needs the secret. */
async function handleAccessToken(req, res) {
  const raw = await readBody(req)
  const params = new URLSearchParams(raw)
  const code = params.get('code')

  if (!code) return send(res, 400, { error: 'missing code' })

  const response = await fetch(NOTION_TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: basicAuth(config.clientId, config.clientSecret),
      'content-type': 'application/json',
      'notion-version': '2022-06-28',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      // Must match the value used at authorize time, which was our callback —
      // not whatever redirect_uri the client sent.
      redirect_uri: callbackUrl,
    }),
  })

  const payload = await response.text()

  if (!response.ok) {
    // Notion's message is safe to relay; the secret is never in it.
    console.error(`Token exchange failed: ${response.status}`)
    return send(res, response.status, payload, {
      'content-type': 'application/json',
    })
  }

  send(res, 200, payload, { 'content-type': 'application/json' })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', config.publicBaseUrl)

  try {
    if (req.method === 'GET' && url.pathname === '/api/authorize') {
      return handleAuthorize(url, res)
    }
    if (req.method === 'GET' && url.pathname === '/api/code') {
      return handleCode(url, res)
    }
    if (req.method === 'POST' && url.pathname === '/api/access-token') {
      return await handleAccessToken(req, res)
    }
    if (req.method === 'GET' && url.pathname === '/healthz') {
      return send(res, 200, { ok: true })
    }
    send(res, 404, { error: 'not found' })
  } catch (error) {
    // Log server-side, stay vague to the caller: this endpoint is internet
    // facing and error text is a fingerprinting surface.
    console.error('Unhandled error:', error?.message ?? error)
    if (!res.headersSent) send(res, 500, { error: 'internal error' })
  }
})

server.listen(config.port, config.host, () => {
  console.log(`getdone-oauth listening on ${config.host}:${config.port}`)
  console.log(`callback registered with Notion must be: ${callbackUrl}`)
})
