#!/bin/bash
#
# ClawBot Agent - Raspberry Pi Setup Script
#
# Run this on your Raspberry Pi to install everything needed:
#   curl -fsSL https://raw.githubusercontent.com/openclaw12/ClawDashboard/master/agent/setup-pi.sh | bash
#
# Or manually:
#   chmod +x agent/setup-pi.sh && ./agent/setup-pi.sh
#

set -e

echo ""
echo "  ClawBot Agent - Raspberry Pi Setup"
echo "  ═══════════════════════════════════"
echo ""

# 1. Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "  [1/4] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "  [1/4] Node.js already installed: $(node --version)"
fi

# 2. Install scrot for screenshots
if ! command -v scrot &> /dev/null; then
    echo "  [2/4] Installing scrot (screenshot tool)..."
    sudo apt-get update -qq
    sudo apt-get install -y scrot
else
    echo "  [2/4] scrot already installed"
fi

# 3. Install cloudflared for tunnel
if ! command -v cloudflared &> /dev/null; then
    echo "  [3/4] Installing cloudflared..."
    # Detect architecture
    ARCH=$(dpkg --print-architecture)
    if [ "$ARCH" = "armhf" ] || [ "$ARCH" = "arm64" ]; then
        curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -o /tmp/cloudflared.deb
        sudo dpkg -i /tmp/cloudflared.deb
        rm /tmp/cloudflared.deb
    else
        echo "    Unsupported architecture: $ARCH"
        echo "    Please install cloudflared manually: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    fi
else
    echo "  [3/4] cloudflared already installed"
fi

# 4. Install npm dependencies
echo "  [4/4] Installing agent dependencies..."
cd "$(dirname "$0")/.."
npm install --production 2>/dev/null || npm install ws screenshot-desktop 2>/dev/null

echo ""
echo "  Setup complete!"
echo ""
echo "  To start the agent:"
echo "    cd $(pwd)"
echo "    node agent/server.js"
echo ""
echo "  To expose via Cloudflare Tunnel (in another terminal):"
echo "    cloudflared tunnel --url http://localhost:9900"
echo ""
echo "  Copy the tunnel URL (e.g. https://xxx.trycloudflare.com)"
echo "  and paste it into the ClawDashboard Settings page."
echo ""
