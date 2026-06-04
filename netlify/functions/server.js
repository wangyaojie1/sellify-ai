const express = require('express');
const serverless = require('serverless-http');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: req.body.priceId || process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: req.body.successUrl || process.env.SITE_URL + '/success',
      cancel_url: req.body.cancelUrl || process.env.SITE_URL + '/cancel',
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify license
app.post('/verify-license', (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ valid: false });
  const isValid = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey);
  res.json({ valid: isValid, plan: isValid ? 'pro' : 'free' });
});

// Stripe webhook
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const email = event.data.object.customer_details?.email;
      const hash = crypto.createHmac('sha256', process.env.LICENSE_SECRET || 'default')
        .update(email + Date.now()).digest('hex').substring(0, 24).toUpperCase();
      const key = hash.match(/.{1,4}/g).join('-');
      console.log('License generated for:', email, key);
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).send('Webhook error');
  }
});

// Health
app.get('/health', (req, res) => { res.json({ status: 'ok' }); });

module.exports.handler = serverless(app);
