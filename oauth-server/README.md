# GetDone OAuth relay

Notion authenticates its token exchange with the integration's **client secret**.
A Raycast extension is JavaScript on the user's machine, so anything bundled
into it is readable — the secret cannot ship in the extension. This service is
the only component that ever holds it.

Zero dependencies; Node 18+ for global `fetch`.

## Why three endpoints

| Endpoint                 | Job                                                                          |
| ------------------------ | ---------------------------------------------------------------------------- |
| `GET /api/authorize`     | Sends the browser to Notion, substituting **our** callback as `redirect_uri` |
| `GET /api/code`          | Catches Notion's callback and hands the code back to Raycast                 |
| `POST /api/access-token` | Swaps the code for a token using the secret                                  |
| `GET /healthz`           | Liveness, for systemd and uptime checks                                      |

The bounce through `/api/code` is not incidental. Notion requires an exactly
pre-registered `redirect_uri`, and Raycast's redirect carries a query string
(`?packageName=Extension`), so it cannot be registered directly. Registering our
own callback sidesteps that, and `state` carries Raycast's redirect and CSRF
token across the round trip.

For the same reason, `/api/access-token` sends Notion **our** callback as
`redirect_uri` rather than whatever the client posted: the value must match the
one used at authorize time.

## Security notes

- `/api/code` redirects the browser to a URL that arrived over the network
  inside `state`. It is checked against an HTTPS allow-list of Raycast hosts
  first. Without that check the service is an open redirect, and the thing
  being redirected carries a live Notion authorization code.
- The secret is read from the environment and never logged, never echoed, and
  never sent anywhere except `api.notion.com`.
- Bodies are capped at 8 KB. Rate limiting belongs in the reverse proxy.
- Run behind TLS. Notion requires an HTTPS redirect URI, and the token response
  must not cross the network in plaintext.

## Setup

### 1. Create the Notion integration

At <https://www.notion.so/my-integrations>, create a **public** integration.
Under its OAuth settings set the redirect URI to:

```
https://<your-host>/api/code
```

Copy the OAuth client ID and client secret.

### 2. Deploy (Arch Linux)

```bash
sudo mkdir -p /srv/getdone-oauth
sudo cp oauth-server/server.mjs oauth-server/lib.mjs /srv/getdone-oauth/

sudo install -m 0600 /dev/null /etc/getdone-oauth.env
sudo editor /etc/getdone-oauth.env   # contents per .env.example

sudo cp oauth-server/getdone-oauth.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now getdone-oauth
systemctl status getdone-oauth
```

The unit runs under `DynamicUser` with a strict sandbox: no home directory, no
write access, no privilege escalation. It needs none of them.

### 3. Terminate TLS

Caddy gets a certificate automatically:

```
oauth.example.com {
    reverse_proxy 127.0.0.1:8787
}
```

`sudo systemctl enable --now caddy`. Then confirm:

```bash
curl https://oauth.example.com/healthz     # {"ok":true}
```

### 4. Point the extension at it

In `src/services/notion/oauth/constants.ts`:

```ts
export const clientId = '<your Notion OAuth client id>'
export const baseUrl = 'https://oauth.example.com'
```

Existing users re-authorize once: tokens minted by a different integration are
not valid for yours.

## Verifying

```bash
# Should 302 to api.notion.com with redirect_uri pointing at your /api/code
curl -sD - -o /dev/null \
  "https://oauth.example.com/api/authorize?state=test&redirect_uri=https%3A%2F%2Fraycast.com%2Fredirect%3FpackageName%3DExtension" \
  | grep -i location

# Should 400: the open-redirect guard
curl -s "https://oauth.example.com/api/authorize?state=test&redirect_uri=https%3A%2F%2Fevil.example.com"
```

The logic behind both is covered by `test/oauth-relay.test.ts` in the repo root.
