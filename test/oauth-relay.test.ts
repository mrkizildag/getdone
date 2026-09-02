import { describe, expect, test } from 'vitest'
// @ts-expect-error - plain ESM helper, deliberately outside the typed src tree
import {
  basicAuth,
  buildNotionAuthorizeUrl,
  buildRaycastRedirect,
  decodeState,
  encodeState,
  isAllowedRedirect,
} from '../oauth-server/lib.mjs'

const RAYCAST_REDIRECT = 'https://raycast.com/redirect?packageName=Extension'

describe('state round-trip', () => {
  test('carries both values back through Notion’s single state parameter', () => {
    const encoded = encodeState({
      raycastState: 'csrf-token',
      raycastRedirect: RAYCAST_REDIRECT,
    })

    expect(decodeState(encoded)).toEqual({
      raycastState: 'csrf-token',
      raycastRedirect: RAYCAST_REDIRECT,
    })
  })

  test('is url-safe, since it travels as a query parameter', () => {
    const encoded = encodeState({
      raycastState: 'a+b/c=',
      raycastRedirect: RAYCAST_REDIRECT,
    })

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  test('rejects a state that is not ours rather than throwing', () => {
    expect(decodeState('not-base64!!')).toBeNull()
    expect(decodeState('')).toBeNull()
  })
})

describe('redirect allow-list', () => {
  test('permits Raycast over https', () => {
    expect(isAllowedRedirect(RAYCAST_REDIRECT)).toBe(true)
  })

  test('refuses any other host', () => {
    // Without this the relay is an open redirect, and the thing being
    // redirected carries a live Notion authorization code.
    expect(isAllowedRedirect('https://evil.example.com/x')).toBe(false)
    expect(isAllowedRedirect('https://raycast.com.evil.example.com/x')).toBe(
      false
    )
  })

  test('refuses plaintext even on the right host', () => {
    expect(isAllowedRedirect('http://raycast.com/redirect')).toBe(false)
  })

  test('refuses non-http schemes and junk', () => {
    expect(isAllowedRedirect('javascript:alert(1)')).toBe(false)
    expect(isAllowedRedirect('not a url')).toBe(false)
    expect(isAllowedRedirect('')).toBe(false)
  })
})

describe('outbound urls', () => {
  test('sends Notion our own callback, not the client’s redirect', () => {
    // Notion requires an exactly pre-registered redirect_uri, and Raycast's
    // carries a query string.
    const url = new URL(
      buildNotionAuthorizeUrl({
        clientId: 'client-1',
        callbackUrl: 'https://oauth.example.com/api/code',
        state: 'packed',
      })
    )

    expect(url.origin + url.pathname).toBe(
      'https://api.notion.com/v1/oauth/authorize'
    )
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://oauth.example.com/api/code'
    )
    expect(url.searchParams.get('owner')).toBe('user')
    expect(url.searchParams.get('response_type')).toBe('code')
  })

  test('returns Raycast its own state alongside the code', () => {
    const url = new URL(
      buildRaycastRedirect({
        raycastRedirect: RAYCAST_REDIRECT,
        raycastState: 'csrf-token',
        code: 'auth-code',
      })
    )

    expect(url.searchParams.get('code')).toBe('auth-code')
    expect(url.searchParams.get('state')).toBe('csrf-token')
    expect(url.searchParams.get('packageName')).toBe('Extension')
  })

  test('omits state when Raycast did not send one', () => {
    const url = new URL(
      buildRaycastRedirect({
        raycastRedirect: RAYCAST_REDIRECT,
        raycastState: '',
        code: 'auth-code',
      })
    )

    expect(url.searchParams.has('state')).toBe(false)
  })
})

describe('basicAuth', () => {
  test('base64-encodes the colon-delimited credential Notion expects', () => {
    expect(basicAuth('id', 'secret')).toBe(
      'Basic ' + Buffer.from('id:secret').toString('base64')
    )
  })
})
