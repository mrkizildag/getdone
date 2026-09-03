import { describe, expect, test } from 'vitest'
import { shouldReauthorize } from '@/services/notion/oauth/should-reauthorize'

const LEGACY = '1931ba21-legacy'
const OURS = 'a0000000-ours'

const check = (
  overrides: Partial<Parameters<typeof shouldReauthorize>[0]> = {}
) =>
  shouldReauthorize({
    hasToken: true,
    recordedIssuer: undefined,
    currentClientId: LEGACY,
    legacyClientId: LEGACY,
    ...overrides,
  })

describe('before the switch', () => {
  test('leaves an existing install signed in', () => {
    // The common case today: a token from before issuers were recorded, while
    // the extension still points at the same integration.
    expect(check()).toBe(false)
  })

  test('leaves an install signed in once its issuer is recorded', () => {
    expect(check({ recordedIssuer: LEGACY })).toBe(false)
  })
})

describe('after the switch', () => {
  test('re-authorizes a token that predates issuer tracking', () => {
    // Without this the token keeps working, since the relay only handles the
    // handshake — the switch would look successful and change nothing.
    expect(check({ currentClientId: OURS })).toBe(true)
  })

  test('re-authorizes a token minted by the previous integration', () => {
    expect(check({ recordedIssuer: LEGACY, currentClientId: OURS })).toBe(true)
  })

  test('leaves a token minted by the new integration alone', () => {
    expect(check({ recordedIssuer: OURS, currentClientId: OURS })).toBe(false)
  })
})

describe('no token yet', () => {
  test('has nothing to re-authorize', () => {
    expect(check({ hasToken: false })).toBe(false)
    expect(check({ hasToken: false, currentClientId: OURS })).toBe(false)
  })
})
