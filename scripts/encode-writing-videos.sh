#!/usr/bin/env bash
# Re-encode the writing post's screen recordings at a lower bitrate so they start
# playing quickly on ordinary connections. Resolution and frame rate are kept.
# Requires: ffmpeg (e.g. brew install ffmpeg)
# Run from project root: bash scripts/encode-writing-videos.sh
# Tune quality with CRF (higher = smaller file, softer picture): CRF=24 bash scripts/encode-writing-videos.sh
# Files already encoded at or above the target CRF are skipped; to go back to a
# lower CRF, restore the originals from git first.

set -e
DIR="public/writing/site-codex/Assets/video"
CRF="${CRF:-26}"
command -v ffmpeg >/dev/null 2>&1 || { echo "Need ffmpeg: brew install ffmpeg"; exit 1; }

for f in "$DIR"/*.mp4; do
  case "$(basename "$f")" in card-*) continue ;; esac
  current=$(strings -n 6 "$f" | grep -o -m1 'crf=[0-9]*' | cut -d= -f2 || true)
  if [ -n "$current" ] && [ "$current" -ge "$CRF" ]; then
    echo "Skipping (already crf $current): $f"
    continue
  fi
  tmp="${f%.mp4}.encoded.mp4"
  echo "Encoding at crf $CRF: $f"
  ffmpeg -v error -y -i "$f" -an -c:v libx264 -preset slow -crf "$CRF" -pix_fmt yuv420p -movflags +faststart "$tmp"
  mv "$tmp" "$f"
done
echo "Done."
