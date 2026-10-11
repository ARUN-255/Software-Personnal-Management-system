#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  echo 'First copy .env.example to .env and fill in the database and Gemini settings.'
  exit 1
fi
set -a
source .env
set +a
exec mvn spring-boot:run -Dmaven.compiler.proc=full
