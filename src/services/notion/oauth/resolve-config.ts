/**
 * The Notion integration and relay the extension authenticates against.
 *
 * These are overridable rather than hardcoded so that switching to a
 * self-hosted relay is a settings change, not a rebuild — and so anyone can
 * run their own without forking. Left blank, the defaults apply.
 */

/** reboot.studio's integration, inherited from upstream Hypersonic. */
export const DEFAULT_CLIENT_ID = '1931ba21-2fe6-4a82-830b-5a1c8088c17f'
export const DEFAULT_BASE_URL = 'https://hypersonic-oauth.vercel.app'

export interface OAuthPreferences {
  oauthClientId?: string
  oauthBaseUrl?: string
}

export interface OAuthConfig {
  clientId: string
  baseUrl: string
  authorizeUrl: string
  tokenUrl: string
}

const orDefault = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export function resolveOAuthConfig(
  preferences: OAuthPreferences = {}
): OAuthConfig {
  const clientId = orDefault(preferences.oauthClientId, DEFAULT_CLIENT_ID)

  // A trailing slash would produce `//api/authorize`, which some proxies
  // redirect and others reject — and pasting one is easy to do.
  const baseUrl = orDefault(preferences.oauthBaseUrl, DEFAULT_BASE_URL).replace(
    /\/+$/,
    ''
  )

  return {
    clientId,
    baseUrl,
    authorizeUrl: `${baseUrl}/api/authorize`,
    tokenUrl: `${baseUrl}/api/access-token`,
  }
}
