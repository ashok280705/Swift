# AWS Deployment Guide — Swift / CrossRemit

Full pipeline: **GitHub → CodePipeline → CodeBuild → S3 → CodeDeploy → EC2**

---

## Architecture Overview

```
GitHub (push to main)
        │
        ▼
  CodePipeline
        │
   ┌────┴────┐
   │         │
CodeBuild   (source stage)
   │  buildspec.yml
   │  • npm ci
   │  • next build
   │  • packages deployment_dist/
   │         │
   ▼         ▼
  S3 Artifact Bucket
        │
        ▼
   CodeDeploy
   appspec.yml + scripts/
        │
        ▼
   EC2 Instance
   PM2 → node server.js :3000
        │
        ▼
  (optional) ALB → HTTPS
```

---

## Step 1 — EC2 Instance

### Launch
- **AMI**: Amazon Linux 2023 (or Amazon Linux 2)
- **Instance type**: t3.small minimum (t3.medium recommended)
- **Security Group inbound rules**:
  - Port 22 (SSH) — your IP only
  - Port 3000 (app) — from ALB security group (or 0.0.0.0/0 for testing)
  - Port 80/443 — if using ALB

### IAM Role for EC2
Create a role with these managed policies and attach it to the instance:
- `AmazonSSMManagedInstanceCore` — for SSM Session Manager (no SSH needed)
- `AmazonS3ReadOnlyAccess` — to pull the CodeDeploy artifact
- `AWSCodeDeployFullAccess` — for CodeDeploy agent

### Bootstrap the instance (run once via SSH or SSM)

```bash
# Update system
sudo dnf update -y   # AL2023
# sudo yum update -y # AL2

# Install Node.js 20 via nvm (as ec2-user)
sudo su - ec2-user
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version   # should print v20.x.x

# Install PM2
npm install -g pm2

# Create log directory
mkdir -p ~/logs

# Install CodeDeploy agent (as root)
exit   # back to root/sudo
sudo dnf install -y ruby wget   # AL2023
# sudo yum install -y ruby wget # AL2
cd /home/ec2-user
wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl start codedeploy-agent
sudo systemctl enable codedeploy-agent
sudo systemctl status codedeploy-agent   # should show "active (running)"
```

> Replace `ap-south-1` with your AWS region in the CodeDeploy agent URL.

### Place secrets on the instance

```bash
sudo su - ec2-user
mkdir -p /home/ec2-user/swift-app
cat > /home/ec2-user/swift-app/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://vyywpyxfxdvncwnquymv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GROQ_API_KEY=gsk_...
SERPER_API_KEY=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
EOF
chmod 600 /home/ec2-user/swift-app/.env.local
```

These secrets are preserved across every deployment by `before_install.sh` / `after_install.sh`.

---

## Step 2 — S3 Artifact Bucket

```
Name:    swift-codepipeline-artifacts-<your-account-id>
Region:  same as your EC2
Versioning: enabled
Block public access: ON (all checkboxes)
```

---

## Step 3 — IAM Roles

### CodeBuild service role
Create role `swift-codebuild-role` with:
- `AWSCodeBuildAdminAccess` (or a scoped policy)
- `AmazonS3FullAccess` (for artifact bucket)
- `AmazonSSMReadOnlyAccess` (if using Parameter Store for secrets)

### CodeDeploy service role
Create role `swift-codedeploy-role` with:
- `AWSCodeDeployRole` (AWS managed)

### CodePipeline service role
Create role `swift-codepipeline-role` with:
- `AWSCodePipelineFullAccess`
- `AmazonS3FullAccess`
- `AWSCodeBuildAdminAccess`
- `AWSCodeDeployFullAccess`

---

## Step 4 — CodeDeploy

1. **Applications** → Create application
   - Application name: `swift-app`
   - Compute platform: **EC2/On-premises**

2. **Deployment groups** → Create deployment group
   - Name: `swift-prod`
   - Service role: `swift-codedeploy-role`
   - Deployment type: **In-place**
   - Environment: **Amazon EC2 instances**
   - Tag key: `Name`, value: `swift-ec2` (tag your EC2 with this)
   - Deployment config: `CodeDeployDefault.AllAtOnce` (single instance)
   - Load balancer: disable for now (enable later with ALB)

---

## Step 5 — CodeBuild

1. **Create build project**
   - Name: `swift-build`
   - Source: GitHub (connect your repo, branch: `main`)
   - Environment:
     - Managed image: Amazon Linux 2023
     - Runtime: Standard
     - Image: `aws/codebuild/amazonlinux2023-x86_64-standard:5.0`
     - Service role: `swift-codebuild-role`
   - Buildspec: **Use a buildspec file** → `buildspec.yml`
   - Artifacts: Amazon S3 → bucket `swift-codepipeline-artifacts-...`

2. **Add environment variables** in the CodeBuild project console:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://vyywpyxfxdvncwnquymv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_...
   NEXT_PUBLIC_RAZORPAY_KEY_ID   = rzp_test_...
   ```
   (These are public-safe — they get baked into the JS bundle anyway.)

---

## Step 6 — CodePipeline

1. **Create pipeline**
   - Name: `swift-pipeline`
   - Service role: `swift-codepipeline-role`
   - Artifact store: S3 bucket from Step 2

2. **Source stage**
   - Provider: GitHub (Version 2) — connect via CodeStar connection
   - Repo: your repo, Branch: `main`
   - Detection: GitHub webhooks (auto-trigger on push)

3. **Build stage**
   - Provider: AWS CodeBuild
   - Project: `swift-build`

4. **Deploy stage**
   - Provider: AWS CodeDeploy
   - Application: `swift-app`
   - Deployment group: `swift-prod`

---

## Step 7 — Test the Pipeline

```bash
git add .
git commit -m "chore: trigger pipeline"
git push origin main
```

Watch in the AWS console:
- CodePipeline → pipeline turns green stage by stage
- CodeDeploy → deployment shows lifecycle events
- SSH/SSM into EC2 and check: `sudo -u ec2-user pm2 status`

---

## Step 8 — (Optional) HTTPS with ALB + ACM

1. Request a certificate in **ACM** for your domain
2. Create an **Application Load Balancer**:
   - Listener 443 → forward to target group (EC2 port 3000)
   - Listener 80 → redirect to 443
3. Point your domain's DNS to the ALB
4. Update EC2 security group: allow port 3000 only from ALB SG

---

## Useful Commands (on EC2)

```bash
# Check app status
sudo -u ec2-user pm2 status

# View live logs
sudo -u ec2-user pm2 logs swift

# Restart manually
sudo -u ec2-user pm2 restart swift

# Check CodeDeploy agent
sudo systemctl status codedeploy-agent

# View last deployment log
sudo tail -100 /var/log/aws/codedeploy-agent/codedeploy-agent.log
```

---

## File Reference

| File | Purpose |
|------|---------|
| `buildspec.yml` | CodeBuild instructions (install → build → package artifact) |
| `appspec.yml` | CodeDeploy instructions (where to deploy + lifecycle hooks) |
| `scripts/before_install.sh` | Backs up `.env.local`, wipes old deployment |
| `scripts/after_install.sh` | Restores `.env.local`, installs PM2, fixes ownership |
| `scripts/application_stop.sh` | Stops PM2 process before new code lands |
| `scripts/application_start.sh` | Starts PM2 with new code |
| `scripts/validate_service.sh` | Health-checks port 3000 after start |
| `Dockerfile` | Multi-stage Docker build (for local testing / ECS later) |
| `docker-compose.yml` | Local Docker testing |
| `.env.example` | Template for secrets |
