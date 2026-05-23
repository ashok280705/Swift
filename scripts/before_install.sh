#!/bin/bash
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
