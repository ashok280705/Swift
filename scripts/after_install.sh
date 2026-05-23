#!/bin/bash
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
