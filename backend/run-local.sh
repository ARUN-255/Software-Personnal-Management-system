#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  echo 'First copy .env.example to .env and fill in the database and optional cloud settings.'
  exit 1
fi
set -a
source .env
set +a
# Empty static credential variables must not mask the default AWS credential chain.
if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]]; then unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN; fi
exec mvn spring-boot:run
