#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-lightfall-webgl-test.mp4}"

curl -fsS \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"templateId":"lightfall-promo"}' \
  http://127.0.0.1:3000/render \
  -o "$OUT"

if [ ! -s "$OUT" ]; then
  echo "Render produced an empty file" >&2
  exit 1
fi

ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate -of default=noprint_wrappers=1 "$OUT"
