#!/usr/bin/env bash
# Re-encodes the bundled practice clips so they cost far less bandwidth to serve.
#
#   npm run optimize:videos            # all of public/videos/*.mp4
#   scripts/optimize-videos.sh a.mp4   # specific files
#
# Why: GitHub Pages has a soft limit of 100 GB of bandwidth a month. The
# clips are always played blurred, so 720p at 2-5 Mbps is wasted bytes.
# 480p at about 600 kbps looks the same through the blur and is about 5x
# smaller. That means about 5x more players on the same bandwidth.
#
#   -movflags +faststart  puts the moov index at the start of the file, so the
#                         browser can start playing (and make byte-range
#                         requests) before the whole file has downloaded.
#   -t 90                 an opening is about 90s; nothing past that is needed.
#
# A file is only re-encoded when that makes it smaller; otherwise it is just
# remuxed (streams copied) for faststart, so running this again is safe.
set -euo pipefail

cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg is required (brew install ffmpeg)"; exit 1; }

files=("$@")
[ ${#files[@]} -eq 0 ] && files=(public/videos/*.mp4)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

before=0
after=0
for f in "${files[@]}"; do
  out="$tmp/$(basename "$f")"
  ffmpeg -hide_banner -loglevel error -y -i "$f" -t 90 \
    -vf "scale=-2:'min(480,ih)'" \
    -c:v libx264 -preset slow -crf 28 -maxrate 700k -bufsize 1400k \
    -pix_fmt yuv420p -c:a aac -b:a 96k -ac 2 \
    -movflags +faststart "$out"

  old=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  new=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
  before=$((before + old))
  if [ "$new" -lt "$old" ]; then
    mv "$out" "$f"
    after=$((after + new))
    printf '%-28s %6s KB -> %6s KB\n' "$f" $((old / 1024)) $((new / 1024))
  else
    # Already small: keep its streams but still move the index to the front.
    ffmpeg -hide_banner -loglevel error -y -i "$f" -c copy -movflags +faststart "$out"
    mv "$out" "$f"
    after=$((after + old))
    printf '%-28s %6s KB (kept, remuxed for faststart)\n' "$f" $((old / 1024))
  fi
done

printf '\nTotal: %s MB -> %s MB\n' $((before / 1048576)) $((after / 1048576))
