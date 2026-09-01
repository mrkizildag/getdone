import { OAuth } from '@raycast/api'

export const oauthClient = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: 'Notion',
  // Deliberately not renamed with the extension: Raycast keys stored OAuth
  // tokens by providerId, so changing it would sign every existing user out
  // and force them through Notion authorization again for no visible gain.
  providerId: 'hypersonic',
  providerIcon: 'notion-logo.png',
  description: 'Connect your Notion account to getdone',
})
