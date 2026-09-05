/**
 * A stored Notion token keeps working regardless of which relay obtained it —
 * the relay only handles the handshake, after which the extension talks to
 * Notion directly. So pointing the extension at a new integration does nothing
 * on its own: existing installs would quietly keep using a token minted by the
 * old one, and the switch would look successful while changing nothing.
 *
 * Recording which integration issued the token, and comparing on every launch,
 * is what makes the switch actually take effect.
 */
export function shouldReauthorize({
  hasToken,
  recordedIssuer,
  currentClientId,
  legacyClientId,
}: {
  hasToken: boolean
  /** Issuer stored alongside the token, absent on installs predating this. */
  recordedIssuer: string | undefined
  currentClientId: string
  legacyClientId: string
}): boolean {
  if (!hasToken) return false

  // No record means the token predates this check, which can only have come
  // from the integration in use at the time.
  return (recordedIssuer ?? legacyClientId) !== currentClientId
}
