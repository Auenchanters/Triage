#!/usr/bin/env sh
set -e
CFG="${ROUTER_CONFIG:-config/default.yaml}"

# Seed a run so the dashboard opens with data (skipped if results already mounted).
if [ ! -f results/latest.json ]; then
  echo "seeding eval run with $CFG ..."
  python -m eval.harness --config "$CFG" || echo "harness seed failed (continuing)"
fi

exec uvicorn server.api:app --host 0.0.0.0 --port 8000
