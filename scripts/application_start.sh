#!/bin/bash
echo "Starting Next.js application..."

cd /home/ec2-user/crossremit-app

# IMPORTANT: If your Next.js application was built in a subdirectory (e.g. 'app/'), 
# the standalone output might place server.js inside an 'app' directory within the output.
# We check if it exists in the root first. If not, check 'app/server.js'.
if [ ! -f "server.js" ] && [ -f "app/server.js" ]; then
    cd app
fi

# Load nvm and node if they are installed via nvm (common on EC2)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start the standalone server
# Note: Since the AfterInstall script chowned the directory to ec2-user,
# we run PM2 as the ec2-user so it doesn't run as root.
sudo -u ec2-user pm2 start server.js --name "crossremit" --env production

# Save the PM2 list so it automatically resurrects on reboot
sudo -u ec2-user pm2 save
