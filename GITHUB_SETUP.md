# GitHub Repository Setup Guide

## Quick Start

Once Git is installed, follow these steps to push your project to GitHub:

### Step 1: Create a GitHub Account & Repository

1. Go to https://github.com
2. Sign up for a free account (if you don't have one)
3. Click **"+"** → **"New repository"**
4. Name it: `hermoso-descanso-hotel-system`
5. Add description: "Full-stack hotel management system with Node.js, Express, React, and MongoDB"
6. Choose **Public** (or Private if preferred)
7. Click **"Create repository"** (DON'T initialize with README - we have one!)

### Step 2: Configure Git Locally

After Git finishes installing, run these commands in PowerShell:

```powershell
cd "c:\Users\qwre\Desktop\hermosa descanso"

# Set your Git identity
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Step 3: Initialize & Push to GitHub

```powershell
# Initialize git (if not done already)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Full hotel management system with Node/Express/React/MongoDB"

# Add GitHub as remote (replace USERNAME/REPO with your actual repo)
git remote add origin https://github.com/YOUR_USERNAME/hermoso-descanso-hotel-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Authentication

GitHub will ask for authentication. You have two options:

**Option A: Personal Access Token (Recommended)**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control)
4. Copy the token
5. Paste it when Git asks for password

**Option B: SSH Key**
1. Run: `ssh-keygen -t ed25519 -C "your-email@example.com"`
2. Add key to GitHub: Settings → SSH and GPG keys

## File Structure

Your repository will have:

```
hermoso-descanso-hotel-system/
├── .gitignore              # Excludes node_modules, .env, etc.
├── .env.example            # Template for environment variables
├── README.md               # Full deployment documentation
├── package.json            # Dependencies
├── server.js               # Express backend
├── public/
│   ├── index.html
│   ├── app.js             # React frontend
│   └── ...
├── node_modules/          # (ignored by .gitignore)
└── ...
```

## Useful Git Commands After Setup

```powershell
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push

# Pull latest changes
git pull

# View log
git log --oneline
```

## Deployment with GitHub

Once your repo is on GitHub, you can:

1. **Connect to Render** (Recommended)
   - Go to render.com
   - Click "New +" → "Web Service"
   - Select "GitHub" and authorize
   - Choose your repository
   - Render will auto-deploy on every push!

2. **Share with Others**
   - Make repository public
   - Share GitHub URL
   - Anyone can clone it: `git clone https://github.com/YOUR_USERNAME/hermoso-descanso-hotel-system.git`

## GitHub URL Format

Your repo will be at:
```
https://github.com/YOUR_USERNAME/hermoso-descanso-hotel-system
```

## Important: Never Commit These Files!

✅ The `.gitignore` file already prevents:
- `node_modules/` (1GB+)
- `.env` (contains secrets!)
- `npm-debug.log`
- `mongo-check.txt`
- IDE files

Always check before committing: `git status`

## Next Steps

1. Wait for Git installation to complete
2. Run the commands in Step 2 & 3
3. Your project will be on GitHub!
4. You can then deploy to Render for free hosting

Questions? Check: https://docs.github.com/en/get-started
