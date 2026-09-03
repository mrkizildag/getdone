import { LocalStorage, OAuth } from '@raycast/api'
import { oauthClient } from './client'
import { authorizeUrl, tokenUrl, clientId, legacyClientId } from './constants'
import { shouldReauthorize } from './should-reauthorize'
import fetch from 'node-fetch'

/** Which Notion integration minted the token currently stored. */
const TOKEN_ISSUER_KEY = 'oauth-token-issuer'

export async function authorize(): Promise<string | null> {
  const tokenSet = await oauthClient.getTokens()
  const recordedIssuer = await LocalStorage.getItem<string>(TOKEN_ISSUER_KEY)

  const stale = shouldReauthorize({
    hasToken: !!tokenSet?.accessToken,
    recordedIssuer,
    currentClientId: clientId,
    legacyClientId,
  })

  if (tokenSet?.accessToken && !stale) {
    return tokenSet.accessToken
  }

  // Token belongs to a different Notion integration; it would keep working,
  // which is exactly the problem — drop it so the new one is actually used.
  if (stale) {
    await oauthClient.removeTokens()
  }

  const authRequest = await oauthClient.authorizationRequest({
    endpoint: authorizeUrl,
    clientId: clientId,
    scope: '',
    extraParameters: {
      owner: 'user',
    },
  })

  const { authorizationCode } = await oauthClient.authorize(authRequest)
  const accessToken = await fetchToken(authRequest, authorizationCode)

  await oauthClient.setTokens({ accessToken, refreshToken: '' })
  await LocalStorage.setItem(TOKEN_ISSUER_KEY, clientId)

  return accessToken
}

async function fetchToken(
  authRequest: OAuth.AuthorizationRequest,
  authCode: string
): Promise<string> {
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('code', authCode)
  params.append('code_verifier', authRequest.codeVerifier)
  params.append('grant_type', 'authorization_code')
  params.append('redirect_uri', authRequest.redirectURI)

  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: params,
  })

  if (!response.ok) {
    throw new Error('Bad response from token endpoint')
  }

  const data = (await response.json()) as any

  return data.access_token
}
