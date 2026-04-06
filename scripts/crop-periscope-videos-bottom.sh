#!/usr/bin/env bash
# Crop 2px from the bottom of Periscope video assets to remove hairline.
# Requires: ffmpeg (e.g. brew install ffmpeg)
# Run from project root: bash scripts/crop-periscope-videos-bottom.sh

set -e
DIR="public/projects/periscope"
for f in "$DIR/00-periscope.mp4" "$DIR/01-periscope.mp4" "$DIR/02-periscope.mp4"; do
  [ -f "$f" ] || { echo "Missing $f"; exit 1; }
done
command -v ffmpeg >/dev/null 2>&1 || { echo "Need ffmpeg: brew install ffmpeg"; exit 1; }

for f in "$DIR/00-periscope.mp4" "$DIR/01-periscope.mp4" "$DIR/02-periscope.mp4"; do
  tmp="${f}.cropped.mp4"
  echo "Cropping 2px from bottom: $f"
  ffmpeg -y -i "$f" -vf "crop=in_w:in_h-2:0:0" -c:a copy "$tmp"
  mv "$tmp" "$f"
done
echo "Done."
