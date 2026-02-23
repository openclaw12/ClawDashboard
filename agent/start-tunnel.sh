#!/bin/bash
#
# Wrapper script for cloudflared that captures the tunnel URL to a file.
# Used by the systemd service so the agent can serve the URL.
#

TUNNEL_URL_FILE="${HOME}/.clawbot-tunnel-url"
PORT="${1:-9900}"

# Remove old URL file
rm -f "$TUNNEL_URL_FILE"

# Start cloudflared, tee stderr so we can capture the URL
cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate 2>&1 | while IFS= read -r line; do
    echo "$line" >&2
    # Look for the trycloudflare URL
    URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' || true)
    if [ -n "$URL" ] && [ ! -f "$TUNNEL_URL_FILE" ]; then
        echo "$URL" > "$TUNNEL_URL_FILE"
    fi
done
