/**
 * Sellify AI - Payment Server
 * Handles: Stripe checkout sessions, webhooks, license key generation
 *
 * Deploy to: Railway, Render, or any Node.js host
 * Env vars needed: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LICENSE_SECRET
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));

// Stripe webhook needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email;
      const licenseKey = generateLicenseKey(customerEmail);

      // Store the license key (in production, use a database)
      console.log(`✅ Payment received! Email: ${customerEmail}`);
      console.log(`🔑 License Key: ${licenseKey}`);

      // TODO: Send email with license key to customer
      // await sendLicenseEmail(customerEmail, licenseKey);

      // Store in database
      // await db.licenses.create({ email: customerEmail, key: licenseKey, plan: 'pro', created: new Date() });

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log(`❌ Subscription cancelled: ${subscription.id}`);
      // TODO: Revoke license key
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', express.json(), async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || 'price_REPLACE_WITH_YOUR_PRICE_ID',
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://sellify.ai/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://sellify.ai/cancel',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'always',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify License Key
app.post('/verify-license', express.json(), async (req, res) => {
  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  // TODO: Check against database
  // const license = await db.licenses.findOne({ key: licenseKey });
  // res.json({ valid: !!license, plan: license?.plan || 'free' });

  // For now, accept any validly-formatted key
  const isValid = verifyLicenseFormat(licenseKey);
  res.json({ valid: isValid, plan: isValid ? 'pro' : 'free' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- License Key Utilities ---

function generateLicenseKey(email) {
  const secret = process.env.LICENSE_SECRET || 'sellify-secret-key-change-me';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(email + Date.now())
    .digest('hex')
    .substring(0, 24)
    .toUpperCase();

  // Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  return hash.match(/.{1,4}/g).join('-');
}

function verifyLicenseFormat(key) {
  // Basic format check: 6 groups of 4 chars separated by dashes
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡ Sellify AI Payment Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Webhook:      http://localhost:${PORT}/webhook`);
});
