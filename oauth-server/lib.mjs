/**
 * Pure helpers for the OAuth relay. Kept separate from the server so the
 * security-relevant decisions can be tested without binding a socket.
 */

/** Raycast is the only place an authorization code may be handed back to. */
const ALLOWED_REDIRECT_HOSTS = new Set(['raycast.com', 'www.raycast.com'])

/**
 * Notion only round-trips a single `state` value, but the relay needs two
 * things back: Raycast's own CSRF state, and the redirect it expects the code
 * to arrive at. Pack both into that one parameter.
 */
export function encodeState({ raycastState, raycastRedirect }) {
  return Buffer.from(
    JSON.stringify({ s: raycastState ?? '', r: raycastRedirect ?? '' }),
    'utf8'
  ).toString('base64url')
}

export function decodeState(value) {
  try {
    const parsed = JSON.parse(
      Buffer.from(String(value), 'base64url').toString('utf8')
    )
    if (typeof parsed !== 'object' || parsed === null) return null
    return { raycastState: parsed.s ?? '', raycastRedirect: parsed.r ?? '' }
  } catch {
    return null
  }
}

/**
 * Guards against turning the relay into an open redirect: the callback sends
 * the browser wherever `state` says, and `state` arrives from the network.
 * Without this check anyone could craft a link that bounces a victim off this
 * host — with a live Notion authorization code attached.
 */
export function isAllowedRedirect(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_REDIRECT_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

/** Appends the code and Raycast's original state to its redirect URL. */
export function buildRaycastRedirect({ raycastRedirect, raycastState, code }) {
  const url = new URL(raycastRedirect)
  url.searchParams.set('code', code)
  if (raycastState) url.searchParams.set('state', raycastState)
  return url.toString()
}

/**
 * The authorize URL sent on to Notion. `redirect_uri` is deliberately *our*
 * callback rather than the one the client asked for: Notion requires an exactly
 * pre-registered value, and Raycast's redirect carries a query string.
 */
export function buildNotionAuthorizeUrl({ clientId, callbackUrl, state }) {
  const url = new URL('https://api.notion.com/v1/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('owner', 'user')
  url.searchParams.set('state', state)
  return url.toString()
}

/** Basic credential for Notion's token endpoint. */
export function basicAuth(clientId, clientSecret) {
  return (
    'Basic ' +
    Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')
  )
}
