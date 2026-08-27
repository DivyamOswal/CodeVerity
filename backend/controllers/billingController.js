// backend/controllers/billingController.js
import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Plan mappings (12 price IDs) ──────────────────────────────
const PRICE_LOOKUP = {
  // Starter
  "starter-monthly-INR": process.env.STRIPE_PRICE_STARTER_MONTHLY_INR,
  "starter-monthly-USD": process.env.STRIPE_PRICE_STARTER_MONTHLY_USD,
  "starter-yearly-INR": process.env.STRIPE_PRICE_STARTER_YEARLY_INR,
  "starter-yearly-USD": process.env.STRIPE_PRICE_STARTER_YEARLY_USD,
  // Pro
  "pro-monthly-INR": process.env.STRIPE_PRICE_PRO_MONTHLY_INR,
  "pro-monthly-USD": process.env.STRIPE_PRICE_PRO_MONTHLY_USD,
  "pro-yearly-INR": process.env.STRIPE_PRICE_PRO_YEARLY_INR,
  "pro-yearly-USD": process.env.STRIPE_PRICE_PRO_YEARLY_USD,
  // Team
  "team-monthly-INR": process.env.STRIPE_PRICE_TEAM_MONTHLY_INR,
  "team-monthly-USD": process.env.STRIPE_PRICE_TEAM_MONTHLY_USD,
  "team-yearly-INR": process.env.STRIPE_PRICE_TEAM_YEARLY_INR,
  "team-yearly-USD": process.env.STRIPE_PRICE_TEAM_YEARLY_USD,
};

// ─── Helper: get or create Stripe customer ─────────────────────
async function getOrCreateCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

// ─── Create Checkout Session ────────────────────────────────────
export const createCheckoutSession = async (req, res) => {
  try {
    const { plan, cycle, currency } = req.body;
    const userId = req.user.id;

    if (!plan || !cycle || !currency) {
      return res
        .status(400)
        .json({ error: "Missing plan, cycle, or currency." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const priceKey = `${plan}-${cycle}-${currency}`;
    const priceId = PRICE_LOOKUP[priceKey];

    if (!priceId) {
      return res
        .status(400)
        .json({ error: "Invalid plan or price configuration." });
    }

    const customerId = await getOrCreateCustomer(user);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: { userId: userId, plan, cycle, currency },
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
};

// ─── Get current subscription ────────────────────────────────────
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "plan stripeCustomerId stripeSubscriptionId subscriptionStatus subscriptionEndsAt tokensRemaining scansLimit",
    );
    res.json({ subscription: user });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// ─── Cancel subscription ────────────────────────────────────────
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ error: "No active subscription to cancel." });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    user.subscriptionStatus = "canceled";
    await user.save();

    res.json({
      success: true,
      message: "Subscription will be canceled at period end.",
    });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: "Failed to cancel subscription." });
  }
};

// ─── Stripe Webhook Handler ──────────────────────────────────────
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, plan, cycle } = session.metadata;
        const user = await User.findById(userId);
        if (!user) break;

        user.plan = plan;
        user.stripeSubscriptionId = session.subscription;
        user.subscriptionStatus = "active";
        user.subscriptionEndsAt = new Date(
          Date.now() + (cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
        );
        await user.save();
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription,
        );
        const user = await User.findOne({
          stripeSubscriptionId: invoice.subscription,
        });
        if (user) {
          user.subscriptionStatus = "active";
          user.subscriptionEndsAt = new Date(
            subscription.current_period_end * 1000,
          );
          await user.save();
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const user = await User.findOne({
          stripeSubscriptionId: invoice.subscription,
        });
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await User.findOne({
          stripeSubscriptionId: subscription.id,
        });
        if (user) {
          user.plan = "starter";
          user.stripeSubscriptionId = null;
          user.subscriptionStatus = "canceled";
          user.subscriptionEndsAt = null;
          const config = User.getPlanConfig("starter");
          user.tokensRemaining = config.tokens;
          user.scansLimit = config.scans;
          await user.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: "Webhook processing failed." });
  }
};
