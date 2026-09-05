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

### 4. Verify before cutting over

```bash
./verify.sh https://oauth.example.com
```

Exercises the happy path and both open-redirect guards. Passing does not prove
the Notion credentials are right — only a real sign-in does that — but failing
means the sign-in cannot possibly work.

Later redeploys are one command:

```bash
./deploy.sh mrk@arch-box
```

It syncs the two source files, restarts the unit and confirms it came back. The
environment file holding the secret is never touched: it lives on the host only.

### 5. Point the extension at it

No code change and no rebuild. In Raycast, **Settings → Extensions → GetDone**:

| Preference              | Value                       |
| ----------------------- | --------------------------- |
| Self-hosted OAuth relay | `https://oauth.example.com` |
| Notion OAuth client ID  | the client ID from step 1   |

Leave either blank to fall back to the bundled defaults.

Changing the client ID is what makes the switch take effect. A stored Notion
token keeps working whichever relay obtained it — the relay only handles the
handshake — so without noticing the change, the extension would go on using a
token minted by the old integration. It records which integration issued the
token and re-authorizes when that no longer matches, so you sign in once after
setting these and are then entirely on your own infrastructure.

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
