#!/bin/bash
set -e
echo "=== ApplicationStart: launching Next.js via PM2 ==="

DEPLOY_DIR="/home/ec2-user/swift-app"
APP_NAME="swift"

# ── Load Node via nvm (ec2-user's nvm, not root's) ───────────────────────────
# When CodeDeploy runs as root, $HOME is /root — but nvm is installed under
# ec2-user. We explicitly source ec2-user's nvm so `node` is on PATH.
export NVM_DIR="/home/ec2-user/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
fi

# Fallback: if node is still not found, try the system path
if ! command -v node &>/dev/null; then
    export PATH="/usr/local/bin:/usr/bin:$PATH"
fi

echo "Node: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "PM2:  $(pm2 --version 2>/dev/null || echo 'NOT FOUND')"

# ── Start the standalone server ───────────────────────────────────────────────
# server.js is at the deploy root (CodeBuild copies standalone output there).
# We set the working directory explicitly so Next.js can find .next/static
# and .env.local relative to it.
sudo -u ec2-user bash -c "
    export NVM_DIR='/home/ec2-user/.nvm'
    [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
    cd $DEPLOY_DIR
    pm2 start server.js \
        --name '$APP_NAME' \
        --env production \
        --log /home/ec2-user/logs/swift.log \
        --error /home/ec2-user/logs/swift-error.log \
        --time
    pm2 save
"

# ── Enable PM2 startup on reboot (run once; idempotent) ──────────────────────
# This generates and installs a systemd unit so PM2 auto-starts after reboot.
sudo env PATH="$PATH" pm2 startup systemd -u ec2-user --hp /home/ec2-user 2>/dev/null || true

echo "ApplicationStart complete — app running on port 3000."
