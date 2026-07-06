# ⚙️ GITHUB ACTIONS AUTO-DEPLOYMENT (Fully Automated)

**Setup continuous deployment with GitHub Actions**  
**One-time setup: 30 minutes → Automatic deploys forever**  

---

## 🎯 What This Does

After setup:
- ✅ Every push to master → Auto-deploys to Heroku
- ✅ No manual `git push` commands needed
- ✅ Automatic test running (optional)
- ✅ Deployment logs in GitHub

**No more:**
```bash
git push staging master:main  # Manual command
```

**Instead:**
```bash
git push origin master  # Code automatically deploys
```

---

## 📋 Prerequisites

- ✅ GitHub account (you have this)
- ✅ Repository: https://github.com/OxCryptobot/peerstream
- ✅ Heroku account (you have this)
- ✅ Heroku API key (get below)

---

## 🔑 STEP 1: Get Heroku API Key (2 minutes)

1. Go to: https://dashboard.heroku.com/account/applications/authorizations
2. Click: **"Create Authorization"**
3. Name: `GitHub Actions`
4. Expires in: Never
5. Click: **"Create"**
6. Copy the token (looks like: `abc123def456...`)
7. Keep it safe! ⚠️

---

## 🔐 STEP 2: Add Secrets to GitHub (3 minutes)

1. Go to: https://github.com/OxCryptobot/peerstream
2. Click: **Settings** tab
3. Left sidebar: **Secrets and variables** → **Actions**
4. Click: **"New repository secret"**
5. Add each secret:

**Secret 1: Heroku API Key**
- **Name:** `HEROKU_API_KEY`
- **Value:** (paste the token from Step 1)
- Click: **"Add secret"**

**Secret 2: Heroku App Names**
- **Name:** `HEROKU_APP_STAGING`
- **Value:** `paytray-backend-staging`
- Click: **"Add secret"**

- **Name:** `HEROKU_APP_PROD`
- **Value:** `paytray-backend-prod`
- Click: **"Add secret"**

---

## 📝 STEP 3: Create GitHub Action Workflow (5 minutes)

Create file: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Heroku

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Deploy to Heroku Staging
        if: github.ref == 'refs/heads/master'
        uses: akhileshns/heroku-deploy@v3.13.15
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_STAGING }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          buildpack: "heroku/nodejs"
      
      - name: Notify Deployment
        if: success()
        run: |
          echo "✅ Deployment to Heroku Staging successful!"
          echo "App: https://${{ secrets.HEROKU_APP_STAGING }}.herokuapp.com"
      
      - name: Notify Failure
        if: failure()
        run: |
          echo "❌ Deployment failed. Check logs above."
```

### How to Create the File:

**Option A: Via GitHub Web Editor**
1. Go to: https://github.com/OxCryptobot/peerstream
2. Click: **"Add file"** → **"Create new file"**
3. Filename: `.github/workflows/deploy.yml`
4. Paste the YAML above
5. Click: **"Commit changes"**

**Option B: Via Git CLI**
```bash
# Create directory
mkdir -p .github/workflows

# Create file
cat > .github/workflows/deploy.yml << 'EOF'
[paste YAML above]
EOF

# Commit and push
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin master
```

---

## ✅ STEP 4: Verify Setup (2 minutes)

1. Go to: https://github.com/OxCryptobot/peerstream/actions
2. Click: **"Deploy to Heroku"** workflow
3. Should show recent runs

**If workflow shows:**
- ✅ "Build passing" = Setup complete!
- ❌ "Build failing" = Check error logs and troubleshoot

---

## 🚀 STEP 5: Test Deployment (5 minutes)

Make a test commit to trigger auto-deploy:

```bash
# Make small change
echo "# Updated: $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger GitHub Actions deployment"
git push origin master

# Watch deployment
# Go to: https://github.com/OxCryptobot/peerstream/actions
# Click latest workflow run to watch it deploy
```

**You should see:**
1. ✅ Workflow starts automatically
2. ✅ Builds and deploys code
3. ✅ Shows "Deployment successful"
4. ✅ Check app: https://paytray-backend-staging.herokuapp.com/health

---

## 📊 MONITORING DEPLOYMENTS

### View Deployment History

1. Go to: https://github.com/OxCryptobot/peerstream/actions
2. Click: **"Deploy to Heroku"**
3. See all past deployments
4. Click any row to see logs

### Get Deployment Notifications

**Option A: Email Notifications**
1. Go to: https://github.com/settings/notifications
2. Enable: **"Workflow alerts"**

**Option B: Slack Notifications**
```yaml
# Add to workflow after deployment step:
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "✅ Phase 4 deployed to staging successfully!"
      }
```

---

## 🔄 ADD PRODUCTION DEPLOYMENT (Optional)

After staging is stable, auto-deploy to production:

**Add to workflow:**

```yaml
  deploy-prod:
    runs-on: ubuntu-latest
    needs: deploy  # Wait for staging to succeed
    if: github.ref == 'refs/heads/master'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to Heroku Production
        uses: akhileshns/heroku-deploy@v3.13.15
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_PROD }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

This creates a pipeline:
```
Push to master
    ↓
Deploy to staging (automatic)
    ↓
If successful, deploy to production (automatic)
```

---

## 🐛 TROUBLESHOOTING

### Workflow Fails: "Cannot find org"

**Error:** `Cannot find the organization or user xxx`

**Solution:**
1. Check `secrets.HEROKU_API_KEY` is correct
2. Regenerate API key: https://dashboard.heroku.com/account/applications/authorizations
3. Update GitHub secret

### Workflow Fails: "Deployment failed"

**Error:** Shows in Actions log

**Solution:**
1. Click workflow run to see full logs
2. Look for error message
3. Common issues:
   - Missing environment variable
   - Database connection failed
   - Insufficient dyno hours

### Need to Deploy Manually (If Workflow Fails)

```bash
# Use Web Dashboard or CLI method
# Workflow disabled doesn't affect manual deployment
```

---

## 🎯 WORKFLOW STATUS

Check workflow status badge (optional):

Add to README.md:
```markdown
![Deploy to Heroku](https://github.com/OxCryptobot/peerstream/actions/workflows/deploy.yml/badge.svg)
```

This shows green/red badge of latest deployment status.

---

## ✨ BENEFITS OF GITHUB ACTIONS

✅ **Automatic:** Every push auto-deploys  
✅ **Fast:** No manual CLI commands  
✅ **Traceable:** See all deployments in GitHub  
✅ **Reliable:** Built-in retry logic  
✅ **Safe:** Environment secrets never exposed  
✅ **Scalable:** Can add multiple environments  

---

## 📋 SETUP CHECKLIST

- [ ] Got Heroku API key
- [ ] Added `HEROKU_API_KEY` secret
- [ ] Added `HEROKU_APP_STAGING` secret
- [ ] Added `HEROKU_APP_PROD` secret
- [ ] Created `.github/workflows/deploy.yml`
- [ ] Workflow appears in Actions tab
- [ ] Made test commit to trigger workflow
- [ ] Verified deployment succeeded
- [ ] App is running at https://paytray-backend-staging.herokuapp.com

---

## 🚀 NOW ENABLED

Every push to master → Automatic deployment to Heroku!

No more manual `git push staging master:main` commands.

**Just do:** `git push origin master` and watch it deploy automatically 🚀

---

## 📞 REFERENCE

| Task | Location |
|------|----------|
| GitHub Secrets | https://github.com/OxCryptobot/peerstream/settings/secrets/actions |
| Workflow Runs | https://github.com/OxCryptobot/peerstream/actions |
| Heroku API Key | https://dashboard.heroku.com/account/applications/authorizations |
| Your App (Staging) | https://paytray-backend-staging.herokuapp.com |

---

## ✅ COMPLETE

GitHub Actions deployment is now set up!

Every push to master automatically deploys to Heroku. 🎉

