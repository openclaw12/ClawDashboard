#!/bin/bash
#
# Simple wrapper: starts cloudflared and saves the tunnel URL to a file.
# Works on any system with bash and grep.
#

TUNNEL_URL_FILE="${HOME}/.clawbot-tunnel-url"
LOG_FILE="${HOME}/.clawbot-tunnel.log"
PORT="${1:-9900}"

# Clean old files
rm -f "$TUNNEL_URL_FILE"
rm -f "$LOG_FILE"

# Start cloudflared in the background, logging to a file
cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate > "$LOG_FILE" 2>&1 &
CF_PID=$!

# Wait up to 30 seconds for the URL to appear in the log
for i in $(seq 1 30); do
    sleep 1
    if [ -f "$LOG_FILE" ]; then
        URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG_FILE" | head -1)
        if [ -n "$URL" ]; then
            echo "$URL" > "$TUNNEL_URL_FILE"
            echo "Tunnel URL: $URL" >&2
            break
        fi
    fi
done

# Keep running - wait for cloudflared to exit
wait $CF_PID
