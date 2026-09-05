import { describe, expect, test } from 'vitest'
import {
  DEFAULT_BASE_URL,
  DEFAULT_CLIENT_ID,
  resolveOAuthConfig,
} from '@/services/notion/oauth/resolve-config'

describe('with nothing configured', () => {
  test('falls back to the bundled integration and relay', () => {
    const config = resolveOAuthConfig()

    expect(config.clientId).toBe(DEFAULT_CLIENT_ID)
    expect(config.baseUrl).toBe(DEFAULT_BASE_URL)
  })

  test('treats blank and whitespace-only entries as unset', () => {
    const config = resolveOAuthConfig({ oauthBaseUrl: '  ', oauthClientId: '' })

    expect(config.clientId).toBe(DEFAULT_CLIENT_ID)
    expect(config.baseUrl).toBe(DEFAULT_BASE_URL)
  })
})

describe('with a self-hosted relay', () => {
  test('uses it for both endpoints', () => {
    const config = resolveOAuthConfig({
      oauthBaseUrl: 'https://oauth.example.com',
      oauthClientId: 'ours-1',
    })

    expect(config.clientId).toBe('ours-1')
    expect(config.authorizeUrl).toBe('https://oauth.example.com/api/authorize')
    expect(config.tokenUrl).toBe('https://oauth.example.com/api/access-token')
  })

  test('tolerates a pasted trailing slash', () => {
    // `//api/authorize` is redirected by some proxies and rejected by others.
    const config = resolveOAuthConfig({
      oauthBaseUrl: 'https://oauth.example.com///',
    })

    expect(config.authorizeUrl).toBe('https://oauth.example.com/api/authorize')
  })

  test('trims surrounding whitespace', () => {
    const config = resolveOAuthConfig({
      oauthBaseUrl: '  https://oauth.example.com  ',
      oauthClientId: ' ours-1 ',
    })

    expect(config.baseUrl).toBe('https://oauth.example.com')
    expect(config.clientId).toBe('ours-1')
  })

  test('allows a relay override while keeping the default client id', () => {
    const config = resolveOAuthConfig({
      oauthBaseUrl: 'https://oauth.example.com',
    })

    expect(config.clientId).toBe(DEFAULT_CLIENT_ID)
  })
})
