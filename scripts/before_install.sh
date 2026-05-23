#!/bin/bash
<<<<<<< HEAD
set -e
echo "=== BeforeInstall: backing up secrets and clearing deploy dir ==="

DEPLOY_DIR="/home/ec2-user/swift-app"
ENV_BACKUP="/tmp/.env.local.bak"

# ── Preserve .env.local across deployments ──────────────────────────────────
# The real secrets live only on this EC2 instance. CodeBuild never sees them.
# We back them up before wiping the directory, then restore in AfterInstall.
if [ -f "$DEPLOY_DIR/.env.local" ]; then
    echo "Backing up .env.local to $ENV_BACKUP"
    cp "$DEPLOY_DIR/.env.local" "$ENV_BACKUP"
fi

# ── Wipe previous deployment ─────────────────────────────────────────────────
if [ -d "$DEPLOY_DIR" ]; then
    echo "Removing previous deployment artifacts..."
    rm -rf "$DEPLOY_DIR"
fi

mkdir -p "$DEPLOY_DIR"
echo "BeforeInstall complete."
=======
# Clean up the previous deployment artifacts to ensure a fresh install
echo "Cleaning up deployment directory..."

# Remove previous app directory except for any .env files you might have stored there
if [ -d "/home/ec2-user/crossremit-app" ]; then
    # Keep .env file if it exists by moving it to a temp location
    if [ -f "/home/ec2-user/crossremit-app/app/.env.local" ]; then
        cp /home/ec2-user/crossremit-app/app/.env.local /tmp/.env.local.backup
    elif [ -f "/home/ec2-user/crossremit-app/app/.env" ]; then
        cp /home/ec2-user/crossremit-app/app/.env /tmp/.env.backup
    fi
    
    rm -rf /home/ec2-user/crossremit-app/*
fi

mkdir -p /home/ec2-user/crossremit-app
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
