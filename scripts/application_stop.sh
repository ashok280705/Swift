#!/bin/bash
<<<<<<< HEAD
echo "=== ApplicationStop: stopping PM2 process 'swift' ==="

# Gracefully stop and remove the PM2 process.
# The `|| true` prevents CodeDeploy from failing if PM2 isn't running yet
# (e.g. first-ever deployment).
if command -v pm2 &>/dev/null; then
    sudo -u ec2-user pm2 stop  swift 2>/dev/null || true
    sudo -u ec2-user pm2 delete swift 2>/dev/null || true
    echo "PM2 process stopped."
else
    echo "PM2 not installed — nothing to stop."
fi

echo "ApplicationStop complete."
=======
echo "Stopping PM2 application 'crossremit' (if running)..."
# Check if PM2 is installed and running the app
if command -v pm2 &> /dev/null; then
    sudo -u ec2-user pm2 stop crossremit || true
    sudo -u ec2-user pm2 delete crossremit || true
fi
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
