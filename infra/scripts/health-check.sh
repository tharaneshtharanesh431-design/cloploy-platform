#!/usr/bin/env bash
set -euo pipefail
URL=${1:-https://app.cloploy.app/health}
curl -fSs ${URL}
