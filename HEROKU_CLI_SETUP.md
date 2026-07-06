# 🚀 HEROKU DEPLOYMENT SETUP - Prerequisites & Installation

**Status:** Heroku CLI not detected  
**Action Required:** Install Heroku CLI before deployment  

---

## 📥 Step 1: Install Heroku CLI

### Windows Installation

**Option A: Using Installer (Recommended)**

1. Download from: https://cli-assets.heroku.com/heroku-x64.exe
2. Run the installer
3. Follow the installation wizard
4. Restart terminal/PowerShell after installation
5. Verify: `heroku --version`

**Option B: Using Chocolatey (if installed)**

```powershell
choco install heroku-cli
```

**Option C: Using npm**

```bash
npm install -g heroku
```

**Option D: Using Windows Package Manager**

```powershell
winget install Heroku.CLI
```

### macOS Installation

```bash
# Using Homebrew
brew tap heroku/brew && brew install heroku

# Or download from: https://cli-assets.heroku.com/heroku-darwin-x64.tar.gz
```

### Linux Installation

```bash
# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Or using Snap
sudo snap install heroku --classic
```

---

## ✅ Verify Installation

```bash
heroku --version
# Should output: heroku/X.X.X

heroku login
# Opens browser for authentication
```

---

## 🎯 After Installation: Deploy to Heroku

Once Heroku CLI is installed:

1. Follow: **HEROKU_DEPLOYMENT_CHECKLIST.md**
2. Or run: **DEPLOYMENT_EXECUTION.md** steps

Both guides have complete step-by-step instructions.

---

## 📞 Alternative: Manual Deployment via Heroku Dashboard

If you don't want to install Heroku CLI, you can deploy via web dashboard:

1. Go to: https://dashboard.heroku.com/new
2. Click "Create new app"
3. Name: `paytray-backend-staging`
4. Create app
5. Click "Connect to GitHub"
6. Search: `OxCryptobot/peerstream`
7. Click "Connect"
8. Click "Deploy Branch" (master branch)

Then configure environment variables in app settings.

---

## 🚀 Next: Deploy to Staging

After installing Heroku CLI, run this:

```bash
# 1. Login
heroku login

# 2. Create staging app
heroku create paytray-backend-staging --remote staging

# 3. Deploy
git push staging master:main

# 4. Check status
heroku ps --app paytray-backend-staging

# 5. Verify
curl https://paytray-backend-staging.herokuapp.com/health
```

---

## ✨ Ready to Install?

**Recommended:** Use Heroku installer for Windows
1. Download: https://cli-assets.heroku.com/heroku-x64.exe
2. Run installer
3. Restart PowerShell
4. Run: `heroku --version`
5. Then follow HEROKU_DEPLOYMENT_CHECKLIST.md

