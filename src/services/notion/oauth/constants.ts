/**
 * Notion OAuth endpoints.
 *
 * These currently point at reboot.studio's integration and relay, inherited
 * from upstream. Switching to our own is two edits here — `clientId` and
 * `baseUrl` — once `oauth-server/` is deployed and a Notion public integration
 * is registered. See oauth-server/README.md and issue #4.
 *
 * Changing `clientId` also forces every existing install to re-authorize; see
 * `shouldReauthorize` for why that does not happen on its own.
 */
export const clientId = '1931ba21-2fe6-4a82-830b-5a1c8088c17f'
export const baseUrl = 'https://hypersonic-oauth.vercel.app'

/**
 * The integration that minted tokens before this extension started recording
 * which one it used. An install holding a token but no recorded issuer got it
 * from here, so treating the absence as this value keeps existing users signed
 * in right up until the clientId above actually changes.
 */
export const legacyClientId = '1931ba21-2fe6-4a82-830b-5a1c8088c17f'

export const authorizeUrl = `${baseUrl}/api/authorize`
export const tokenUrl = `${baseUrl}/api/access-token`
