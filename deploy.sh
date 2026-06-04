#!/bin/bash
# ==============================================
# Sellify AI — One-Click Deployment Script
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Sellify AI — Deploy Script        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ==============================================
# Step 1: Git Push
# ==============================================
echo -e "${GREEN}[1/3] Pushing code to remote...${NC}"

if ! git remote get-url origin &>/dev/null; then
    echo -e "${RED}No git remote configured.${NC}"
    echo ""
    echo "First, create a repo on one of these:"
    echo "  • GitHub: https://github.com/new"
    echo "  • Gitee:  https://gitee.com/projects/new"
    echo ""
    echo "Then run:"
    echo "  git remote add origin <YOUR_REPO_URL>"
    echo "  ./deploy.sh"
    exit 1
fi

git push -u origin master 2>&1
echo -e "${GREEN}✅ Code pushed!${NC}"
echo ""

# ==============================================
# Step 2: Deploy Landing Page
# ==============================================
echo -e "${GREEN}[2/3] Deploying landing page...${NC}"

if command -v vercel &>/dev/null; then
    echo "Using Vercel..."
    cd public && vercel --prod --yes 2>&1
elif command -v netlify &>/dev/null; then
    echo "Using Netlify..."
    cd public && netlify deploy --prod --dir=. 2>&1
elif command -v surge &>/dev/null; then
    echo "Using Surge..."
    cd public && surge . sellify-ai.surge.sh 2>&1
else
    echo -e "${RED}No deployment CLI found. Install one:${NC}"
    echo "  npm install -g vercel    # Recommended"
    echo "  npm install -g netlify-cli"
    echo "  npm install -g surge"
    echo ""
    echo "Then run: cd public && vercel --prod"
fi

# ==============================================
# Step 3: Deploy Payment Server
# ==============================================
echo ""
echo -e "${GREEN}[3/3] Deploying payment server...${NC}"
echo ""
echo "Railway (recommended):"
echo "  1. Go to https://railway.app"
echo "  2. New Project → Deploy from GitHub"
echo "  3. Select the server/ directory"
echo "  4. Add env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LICENSE_SECRET"
echo ""
echo "Render (alternative):"
echo "  1. Go to https://render.com"
echo "  2. New Web Service → Connect your repo"
echo "  3. Root Directory: server/"
echo "  4. Build: npm install, Start: node index.js"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deployment Complete! 🎉           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Submit to Chrome Web Store: chrome.google.com/webstore/devconsole"
echo "  2. Upload sellify-webstore.zip"
echo "  3. Set up Stripe at stripe.com"
echo "  4. Start promoting! (see marketing/launch-kit.md)"
