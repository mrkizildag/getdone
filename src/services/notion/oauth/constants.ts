import { getPreferenceValues } from '@raycast/api'
import {
  DEFAULT_CLIENT_ID,
  OAuthPreferences,
  resolveOAuthConfig,
} from './resolve-config'

const config = resolveOAuthConfig(getPreferenceValues<OAuthPreferences>())

export const clientId = config.clientId
export const baseUrl = config.baseUrl
export const authorizeUrl = config.authorizeUrl
export const tokenUrl = config.tokenUrl

/**
 * The integration that minted tokens before the extension recorded which one it
 * used. An install holding a token but no record got it from here, so reading
 * the absence as this value keeps existing users signed in until the configured
 * integration actually differs.
 */
export const legacyClientId = DEFAULT_CLIENT_ID
