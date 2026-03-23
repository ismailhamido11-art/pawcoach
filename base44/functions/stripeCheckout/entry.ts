import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.3.1';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceId } = await req.json();
    if (!priceId) return Response.json({ error: 'priceId required' }, { status: 400 });

    const ALLOWED_PRICES = ["price_1T4tkFDuhaIxY4PGpnhDTx5L", "price_1T4tkFDuhaIxY4PGWLeWApDL"];
    if (!ALLOWED_PRICES.includes(priceId)) return Response.json({ error: 'Invalid price ID' }, { status: 400 });

    const requestOrigin = req.headers.get("origin") || "";
    const origin = requestOrigin.endsWith(".base44.app") ? requestOrigin : "https://paw-coach-care.base44.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${origin}/?premium=success`,
      cancel_url: `${origin}/Premium`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});