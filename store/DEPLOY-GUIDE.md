# 🚀 Sellify AI — Deployment Guide

## Step-by-step to go from code → revenue

---

## STEP 1: Deploy the Landing Page (FREE — 5 min)

The landing page and privacy policy are in `store/`.

### Option A: GitHub Pages
```bash
# Create a repo on GitHub called "sellify-ai"
git init
git add store/landing-page.html store/privacy-policy.html
git commit -m "Add landing page and privacy policy"
git push origin main

# Settings → Pages → Source: main branch → Save
# Your site is live at: https://YOUR_USERNAME.github.io/sellify-ai
```

### Option B: Netlify Drop
```
1. Go to app.netlify.com/drop
2. Drag the store/ folder
3. Done — get a sellify-ai.netlify.app URL
```

---

## STEP 2: Deploy the Payment Server (FREE — 10 min)

### Railway (Recommended — easy deploy)
```
1. Go to railway.app → Sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Select the server/ folder
4. Add environment variables:
   - STRIPE_SECRET_KEY=sk_live_xxx
   - STRIPE_WEBHOOK_SECRET=whsec_xxx
   - LICENSE_SECRET=random-string-32-chars
5. Deploy → Get URL like sellify-api.up.railway.app
```

### Render (Alternative)
```
1. Go to render.com → New Web Service
2. Connect your GitHub repo
3. Root Directory: server/
4. Build Command: npm install
5. Start Command: node index.js
6. Add env vars (same as above)
7. Deploy → Get URL like sellify-api.onrender.com
```

---

## STEP 3: Set Up Stripe (15 min)

### Create Product & Price
```
1. Go to dashboard.stripe.com
2. Products → Add Product
   - Name: "Sellify AI Pro"
   - Description: "Unlimited AI queries for e-commerce optimization"
   - Price: $9.00 USD, Recurring, Monthly
3. Copy the Price ID (starts with "price_")

Example: price_1Nxxxxxx
```

### Create Payment Link
```
1. Products → Select "Sellify AI Pro" → Create Payment Link
2. After payment: Redirect to https://YOUR_DOMAIN/success
3. Copy the payment link

Example: https://buy.stripe.com/test_xxxx
```

### Set Up Webhook
```
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://YOUR_SERVER_URL/webhook
3. Events to listen for:
   - checkout.session.completed
   - customer.subscription.deleted
4. Copy the Webhook Signing Secret (starts with "whsec_")
```

### Update the extension
```
1. Open payment/checkout.html
2. Replace STRIPE_PAYMENT_LINK with your actual Stripe link
3. Open options/options.js
4. Update the verify-license endpoint URL to your server
```

---

## STEP 4: Submit to Chrome Web Store (30 min)

### Create Developer Account
```
1. Go to chrome.google.com/webstore/devconsole
2. Pay $5 one-time registration fee
3. Verify your email
```

### Submit Extension
```
1. Click "New Item"
2. Upload sellify-webstore.zip (in the project root)
3. Fill in the listing:

   Store Listing:
   - Copy from store/chrome-web-store-listing.md

   Screenshots:
   - Upload all 5 from store/screenshots/

   Promo Images:
   - Small tile: store/promo/small-tile-440x280.png
   - Large tile: store/promo/large-tile-920x680.png
   - Marquee: store/promo/marquee-1400x560.png

   Privacy Policy:
   - URL: https://YOUR_DOMAIN/privacy-policy.html

   Payment:
   - Select "In-app purchases" (for Pro subscription)

4. Submit for review
```

### Review Process
- Typically 1-3 business days
- Make sure your extension:
  - Has a clear purpose
  - Doesn't use unnecessary permissions
  - Has a privacy policy
  - Works as described

---

## STEP 5: Launch & Promote

### Pre-Launch
- [ ] Landmark page is live
- [ ] Payment server is running
- [ ] Stripe checkout works (test with test mode first!)
- [ ] Chrome extension submitted for review

### Launch Day
- [ ] Extension goes live on Chrome Web Store
- [ ] Post on Product Hunt
- [ ] Post on Reddit (copy from marketing/launch-kit.md)
- [ ] Post Twitter/X thread
- [ ] Share in Facebook seller groups

### Week 1
- [ ] Respond to every comment/review
- [ ] Fix bugs immediately
- [ ] Track installs and conversions
- [ ] Reach out to early users for feedback

---

## 💰 What Revenue Looks Like

| Milestone | Installs | Pro Users (5%) | Monthly Revenue |
|-----------|----------|----------------|-----------------|
| Launch Day | 100 | 5 | $45 |
| Week 1 | 500 | 25 | $225 |
| Month 1 | 2,000 | 100 | $900 |
| Month 3 | 5,000 | 250 | $2,250 |
| Month 6 | 15,000 | 750 | $6,750 |

---

## 📊 Key Links (to configure)

| What | Where to set it |
|------|-----------------|
| Stripe Payment Link | `payment/checkout.html` line ~55 |
| License Server URL | `options/options.js` line ~60 |
| Privacy Policy URL | Chrome Web Store listing |
| Support Email | Chrome Web Store listing + landing page |

---

## 🆘 Troubleshooting

**Extension rejected from Chrome Web Store?**
- Check permissions are minimal
- Ensure privacy policy is accessible
- Remove any unused code or permissions

**Stripe checkout not working?**
- Test in Stripe test mode first
- Verify the price ID is correct
- Check webhook configuration

**No users installing?**
- Optimize Chrome Web Store listing keywords
- Post in more seller communities
- Run a small Google Ads campaign target "amazon seller tools"

---

**Total initial cost: $5 (Chrome Web Store fee) + Stripe 2.9% per transaction**
**Everything else: FREE (GitHub Pages, Railway, open source)**
