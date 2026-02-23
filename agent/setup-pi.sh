#!/bin/bash
#
# ClawBot Agent - One-Command Raspberry Pi Installer
#
# Run this ONCE on your Pi. After that, everything auto-starts on boot.
# You'll never need to touch the Pi again.
#
# Usage (from the repo directory):
#   chmod +x agent/setup-pi.sh && ./agent/setup-pi.sh
#
# Or remote install:
#   curl -fsSL https://raw.githubusercontent.com/openclaw12/ClawDashboard/master/agent/setup-pi.sh | bash
#

set -e

USER_NAME=$(whoami)
HOME_DIR=$(eval echo ~$USER_NAME)
REPO_DIR="$HOME_DIR/ClawDashboard"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   ClawBot Agent - Pi Installer       ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  User:    $USER_NAME"
echo "  Home:    $HOME_DIR"
echo "  Repo:    $REPO_DIR"
echo ""

# ─── Step 1: Clone repo if not present ────────────────────────────────────────

if [ ! -d "$REPO_DIR" ]; then
    echo "  [1/6] Cloning ClawDashboard repo..."
    git clone https://github.com/openclaw12/ClawDashboard.git "$REPO_DIR"
else
    echo "  [1/6] Repo already exists, pulling latest..."
    cd "$REPO_DIR" && git pull origin master 2>/dev/null || true
fi

cd "$REPO_DIR"

# ─── Step 2: Install Node.js ──────────────────────────────────────────────────

if ! command -v node &> /dev/null; then
    echo "  [2/6] Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "  [2/6] Node.js already installed: $(node --version)"
fi

# ─── Step 3: Install scrot ────────────────────────────────────────────────────

if ! command -v scrot &> /dev/null; then
    echo "  [3/6] Installing scrot (screenshot tool)..."
    sudo apt-get update -qq
    sudo apt-get install -y scrot
else
    echo "  [3/6] scrot already installed"
fi

# ─── Step 4: Install cloudflared ───────────────────────────────────────────────

if ! command -v cloudflared &> /dev/null; then
    echo "  [4/6] Installing cloudflared..."
    ARCH=$(dpkg --print-architecture 2>/dev/null || uname -m)
    case "$ARCH" in
        armhf|armv7l)  ARCH="armhf" ;;
        arm64|aarch64) ARCH="arm64" ;;
        amd64|x86_64)  ARCH="amd64" ;;
    esac
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -o /tmp/cloudflared.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm -f /tmp/cloudflared.deb
else
    echo "  [4/6] cloudflared already installed: $(cloudflared --version 2>&1 | head -1)"
fi

# ─── Step 5: Install npm dependencies ─────────────────────────────────────────

echo "  [5/6] Installing Node.js dependencies..."
cd "$REPO_DIR"
npm install --production 2>&1 | tail -1

# ─── Step 6: Setup systemd services ───────────────────────────────────────────

echo "  [6/6] Setting up auto-start services..."

# Create user systemd directory
mkdir -p "$HOME_DIR/.config/systemd/user"

# Agent service
cat > "$HOME_DIR/.config/systemd/user/clawbot-agent.service" << EOSVC
[Unit]
Description=ClawBot Desktop Agent
After=graphical-session.target

[Service]
Type=simple
Environment=DISPLAY=:0
Environment=XAUTHORITY=$HOME_DIR/.Xauthority
WorkingDirectory=$REPO_DIR
ExecStart=/usr/bin/node $REPO_DIR/agent/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOSVC

# Tunnel service
cat > "$HOME_DIR/.config/systemd/user/clawbot-tunnel.service" << EOSVC
[Unit]
Description=ClawBot Cloudflare Tunnel
After=network-online.target clawbot-agent.service
Requires=clawbot-agent.service

[Service]
Type=simple
ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:9900 --no-autoupdate
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOSVC

# Enable and start services
systemctl --user daemon-reload
systemctl --user enable clawbot-agent.service
systemctl --user enable clawbot-tunnel.service
systemctl --user start clawbot-agent.service
systemctl --user start clawbot-tunnel.service

# Enable lingering so services start even without login
sudo loginctl enable-linger "$USER_NAME" 2>/dev/null || true

# Wait for tunnel to get its URL
echo ""
echo "  Waiting for tunnel URL..."
sleep 5

TUNNEL_URL=""
for i in $(seq 1 12); do
    TUNNEL_URL=$(journalctl --user -u clawbot-tunnel.service --no-pager -n 50 2>/dev/null | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 2
done

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║              SETUP COMPLETE!                 ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

if [ -n "$TUNNEL_URL" ]; then
    echo "  Your tunnel URL is:"
    echo ""
    echo "    $TUNNEL_URL"
    echo ""
    echo "  Go to the ClawDashboard website and paste this URL"
    echo "  in the Live Desktop connect screen."
else
    echo "  Tunnel URL not ready yet. Check with:"
    echo "    journalctl --user -u clawbot-tunnel.service -f"
    echo ""
    echo "  Look for a URL like: https://xxx-xxx.trycloudflare.com"
fi

echo ""
echo "  Both services are set to auto-start on boot."
echo "  You can now close this terminal and never touch this Pi again."
echo ""
echo "  Useful commands:"
echo "    systemctl --user status clawbot-agent"
echo "    systemctl --user status clawbot-tunnel"
echo "    systemctl --user restart clawbot-agent"
echo "    systemctl --user restart clawbot-tunnel"
echo ""
