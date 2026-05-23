#!/bin/bash
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
