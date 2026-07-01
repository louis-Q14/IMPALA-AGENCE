const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const PLANS = {
  immobilier: { name: "Immobilier", monthly: 29, annual: 290 },
  automobile: { name: "Automobile", monthly: 29, annual: 290 },
  complet: { name: "Complet", monthly: 49, annual: 490 },
  poubelles: { name: "Poubelles", monthly: 9, annual: 90 },
};

// GET /api/subscriptions/plans
router.get("/plans", (_req, res) => {
  res.json(PLANS);
});

// POST /api/subscriptions/create-checkout
router.post("/create-checkout", authenticateToken, async (req, res) => {
  try {
    const { plan_type, billing_period } = req.body;
    const plan = PLANS[plan_type];

    if (!plan) {
      return res.status(400).json({ error: "Plan invalide" });
    }

    const amount = billing_period === "annual" ? plan.annual : plan.monthly;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: req.user.email,
      metadata: { userId: String(req.user.userId), plan_type, billing_period },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `IMPALA ${plan.name}` },
            unit_amount: amount * 100,
            recurring: {
              interval: billing_period === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/tarifs?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/tarifs?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Erreur de paiement" });
  }
});

// POST /api/subscriptions/webhook
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: "Signature invalide" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, plan_type, billing_period } = session.metadata;

    const amount = billing_period === "annual" ? PLANS[plan_type].annual : PLANS[plan_type].monthly;
    const endDate = billing_period === "annual"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO subscriptions (user_id, plan_type, billing_period, amount, stripe_subscription_id, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, plan_type, billing_period, amount, session.subscription, endDate]
    );

    await db.query(
      `UPDATE user_services SET subscription_status = 'active'
       WHERE user_id = $1 AND service_type = $2`,
      [userId, plan_type === "complet" ? "immobilier" : plan_type]
    );
  }

  res.json({ received: true });
});

// GET /api/subscriptions/mine
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Subscriptions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// POST /api/subscriptions/manual — soumet une demande en attente d'approbation admin
router.post("/manual", authenticateToken, async (req, res) => {
  try {
    const { service_type, payment_method, amount, formula, annual, unite } = req.body;

    const planMap = {
      immobilier: "real_estate_pro",
      automobile: "auto_pro",
      "immo-auto": "immo_auto_pro",
      reservation: "reservation_pro",
    };
    const svcMap = {
      immobilier: ["real_estate"],
      automobile: ["auto"],
      "immo-auto": ["real_estate", "auto"],
      reservation: ["reservation"],
    };

    const plan_type = planMap[service_type];
    const svc_types = svcMap[service_type];
    if (!plan_type) {
      return res.status(400).json({ error: "Service invalide. Valeurs: immobilier, automobile, immo-auto" });
    }

    // Creer la demande en statut pending
    const reqResult = await db.query(
      `INSERT INTO subscription_requests
         (user_id, service_type, plan_type, formula, payment_method, amount, annual, unite, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id, created_at`,
      [req.user.userId, service_type, plan_type, formula || "standard",
       payment_method || "mobile", amount || 0, !!annual, unite || "CDF"]
    );
    const requestId = reqResult.rows[0].id;

    // Mettre user_services en pending (sans ecraser un abonnement actif)
    for (const svc_type of svc_types) {
      await db.query(
        `INSERT INTO user_services (user_id, service_type, subscription_status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (user_id, service_type)
         DO UPDATE SET subscription_status = 'pending'
         WHERE user_services.subscription_status NOT IN ('active')`,
        [req.user.userId, svc_type]
      );
    }

    res.json({
      success: true,
      status: "pending",
      request_id: requestId,
      message: "Votre demande a ete soumise et est en attente d'approbation.",
    });
  } catch (err) {
    console.error("Manual subscription error:", err);
    res.status(500).json({ error: "Erreur lors de l enregistrement de la demande" });
  }
});

// GET /api/subscriptions/my-requests — demandes de l utilisateur connecte
router.get("/my-requests", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, service_type, formula, payment_method, amount, annual, status, admin_note, created_at, reviewed_at
       FROM subscription_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("My requests error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;