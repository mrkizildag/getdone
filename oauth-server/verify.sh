#!/usr/bin/env bash
# Checks a deployed relay before pointing the extension at it.
#
#   ./verify.sh https://oauth.example.com
#
# Exercises the happy path and the open-redirect guard. Passing here does not
# prove the Notion credentials are right — only a real sign-in does that — but
# failing here means the sign-in cannot possibly work.
set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 https://your-host" >&2
  exit 2
fi
BASE="${BASE%/}"

fail=0
check() {
  local name=$1 expected=$2 actual=$3
  if [[ "$actual" == *"$expected"* ]]; then
    printf '  ok    %s\n' "$name"
  else
    printf '  FAIL  %s\n        expected: %s\n        actual:   %s\n' \
      "$name" "$expected" "$actual"
    fail=1
  fi
}

RAYCAST_REDIRECT='https://raycast.com/redirect?packageName=Extension'
encode() { printf '%s' "$1" | python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read(),safe=""))'; }

echo "verifying $BASE"

check "healthz responds" '"ok":true' \
  "$(curl -sS --max-time 10 "$BASE/healthz" 2>&1)"

authorize=$(curl -sS -o /dev/null -D - --max-time 10 \
  "$BASE/api/authorize?state=verify&redirect_uri=$(encode "$RAYCAST_REDIRECT")" 2>&1 \
  | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')

check "authorize redirects to Notion" 'https://api.notion.com/v1/oauth/authorize' "$authorize"
check "authorize substitutes our callback" "$(encode "$BASE/api/code")" "$authorize"

check "open-redirect guard rejects a foreign host" 'unsupported redirect_uri' \
  "$(curl -sS --max-time 10 "$BASE/api/authorize?state=v&redirect_uri=$(encode 'https://evil.example.com')" 2>&1)"

check "open-redirect guard rejects plaintext" 'unsupported redirect_uri' \
  "$(curl -sS --max-time 10 "$BASE/api/authorize?state=v&redirect_uri=$(encode 'http://raycast.com/redirect')" 2>&1)"

check "token endpoint rejects a request with no code" 'missing code' \
  "$(curl -sS --max-time 10 -X POST "$BASE/api/access-token" 2>&1)"

if [[ $fail -eq 0 ]]; then
  echo "all checks passed — safe to point constants.ts at $BASE"
else
  echo "checks failed — do not cut over yet" >&2
fi
exit $fail
