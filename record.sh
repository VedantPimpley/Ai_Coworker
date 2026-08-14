#!/usr/bin/env bash
# Records screen + agent audio + your mic into demo.mp4
#   ./record.sh          → start recording
#   Ctrl+C               → stop and finalise the file
set -u

OUT="${1:-demo.mp4}"
SIZE=$(xdpyinfo | awk '/dimensions:/{print $2}')

# The agent speaks into whatever sink is active (Bluetooth headphones here), so
# capture that sink's monitor. Falls back to the default sink if BT is off.
SINK=$(pactl info | awk -F': ' '/Default Sink/{print $2}')
MON="${SINK}.monitor"
MIC=$(pactl info | awk -F': ' '/Default Source/{print $2}')
case "$MIC" in *.monitor) MIC=$(pactl list short sources | awk '!/monitor/{print $2; exit}');; esac

echo "screen : $SIZE"
echo "agent  : $MON"
echo "mic    : $MIC"
echo "output : $OUT"
echo "Recording — press Ctrl+C to stop."

ffmpeg -hide_banner -loglevel warning -y \
  -thread_queue_size 1024 -f x11grab -framerate 30 -video_size "$SIZE" -i "${DISPLAY:-:0}" \
  -thread_queue_size 1024 -f pulse -i "$MON" \
  -thread_queue_size 1024 -f pulse -i "$MIC" \
  -filter_complex "[1:a]volume=1.4[agent];[2:a]volume=1.6[me];[agent][me]amix=inputs=2:duration=longest:dropout_transition=0[a]" \
  -map 0:v -map "[a]" \
  -vf scale=1920:-2 \
  -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  "$OUT"

echo
echo "Saved: $OUT"
