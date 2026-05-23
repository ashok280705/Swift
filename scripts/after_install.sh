#!/bin/bash
<<<<<<< HEAD
set -e
echo "=== AfterInstall: restoring secrets and setting up runtime ==="

DEPLOY_DIR="/home/ec2-user/swift-app"
ENV_BACKUP="/tmp/.env.local.bak"

# ── Restore .env.local ───────────────────────────────────────────────────────
# The standalone server reads env vars from the process environment, but
# Next.js also auto-loads .env.local from the working directory at startup.
# We place it at the deploy root so `node server.js` picks it up.
if [ -f "$ENV_BACKUP" ]; then
    echo "Restoring .env.local from backup..."
    cp "$ENV_BACKUP" "$DEPLOY_DIR/.env.local"
    rm -f "$ENV_BACKUP"
else
    echo "WARNING: No .env.local backup found."
    echo "The app will start but API calls requiring secrets will fail."
    echo "SSH into the instance and create $DEPLOY_DIR/.env.local with your secrets."
fi

# ── Install / upgrade PM2 ────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
    echo "PM2 not found — installing globally..."
    npm install -g pm2@latest
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# ── Fix ownership ────────────────────────────────────────────────────────────
chown -R ec2-user:ec2-user "$DEPLOY_DIR"

echo "AfterInstall complete."
=======
echo "Running AfterInstall step..."

# Install PM2 if it isn't installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing globally..."
    npm install -g pm2
fi

# Restore .env files if they were backed up
if [ -f "/tmp/.env.local.backup" ]; then
    echo "Restoring .env.local..."
    mv /tmp/.env.local.backup /home/ec2-user/crossremit-app/app/.env.local
elif [ -f "/tmp/.env.backup" ]; then
    echo "Restoring .env..."
    mv /tmp/.env.backup /home/ec2-user/crossremit-app/app/.env
fi

# Make sure permissions are correct so ec2-user can run PM2
chown -R ec2-user:ec2-user /home/ec2-user/crossremit-app
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
