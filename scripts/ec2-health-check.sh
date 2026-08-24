#!/usr/bin/env bash
set -Eeuo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000/api/health}"
PUBLIC_URL="${PUBLIC_URL:-http://127.0.0.1/api/health}"

failures=0

check() {
  local label="$1"
  local url="$2"
  if curl --fail --silent --show-error --max-time 10 "$url" >/tmp/etemad-health-response; then
    printf '[ok] %s: %s\n' "$label" "$(cat /tmp/etemad-health-response)"
  else
    printf '[fail] %s: %s\n' "$label" "$url"
    failures=$((failures + 1))
  fi
}

if command -v pm2 >/dev/null 2>&1 && pm2 describe etemad-api >/dev/null 2>&1; then
  printf '[ok] PM2 process etemad-api is registered\n'
else
  printf '[fail] PM2 process etemad-api is not registered\n'
  failures=$((failures + 1))
fi

if sudo nginx -t >/tmp/etemad-nginx-test 2>&1; then
  printf '[ok] Nginx configuration is valid\n'
else
  printf '[fail] Nginx configuration is invalid\n'
  cat /tmp/etemad-nginx-test
  failures=$((failures + 1))
fi

check 'Express backend' "$BACKEND_URL"
check 'Nginx reverse proxy' "$PUBLIC_URL"

rm -f /tmp/etemad-health-response /tmp/etemad-nginx-test

if (( failures > 0 )); then
  printf '%s\n' "Health check failed with $failures issue(s)."
  exit 1
fi

printf '%s\n' 'Health check passed.'
