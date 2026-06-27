#!/usr/bin/env bash
# Reproducible README assets: dashboard screenshots + the A/B-stream GIF.
# Needs: a running server on :8000, Google Chrome, ffmpeg. Run from repo root:
#   bash scripts/shots.sh
set -euo pipefail

BASE="http://localhost:8000"
OUT="docs/img"
TMP="$(mktemp -d)"
W=1440; H=1000
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p "$OUT"

shot() {  # shot <url-suffix> <outfile>  — Chrome on Windows needs a native path
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=${W},${H} --virtual-time-budget=2800 \
    --screenshot="$(cygpath -wa "$2")" "$BASE/$1" >/dev/null 2>&1
}

echo "screens…"   # ?still=1 snaps count-ups/bar-fills to final so headless never catches mid-animation
shot "?still=1#overview"              "$OUT/overview.png"
shot "?still=1#routing"               "$OUT/live-routing.png"
shot "?settings=1&still=1#overview"   "$OUT/settings.png"
shot "?theme=light&still=1#overview"  "$OUT/overview-light.png"

echo "A/B GIF frames…"
N=56                              # SEED decision count
for k in $(seq 1 $N); do
  printf -v idx "%03d" "$k"
  shot "?abN=$k#compare" "$TMP/f_$idx.png"
done
# last frame = full panel as the static fallback
cp "$TMP/f_$(printf '%03d' $N).png" "$OUT/ab-comparison.png"

echo "encoding gif…"
# every 2nd frame + 96-color palette keeps it smooth but under ~2 MB for GitHub
ffmpeg -y -framerate 12 -i "$TMP/f_%03d.png" \
  -vf "select='not(mod(n\,2))',scale=860:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer" \
  -loop 0 "$OUT/ab-stream.gif" >/dev/null 2>&1

rm -rf "$TMP"
echo "done -> $OUT"
ls -la "$OUT"
