#!/bin/bash
echo "Stopping PM2 application 'crossremit' (if running)..."
# Check if PM2 is installed and running the app
if command -v pm2 &> /dev/null; then
    sudo -u ec2-user pm2 stop crossremit || true
    sudo -u ec2-user pm2 delete crossremit || true
fi
