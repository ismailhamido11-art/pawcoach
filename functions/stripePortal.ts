import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.3.1';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Get user with stripe_customer_id
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const customerId = users[0]?.stripe_customer_id;
    if (!customerId) return Response.json({ error: "No subscription found" }, { status: 404 });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://paw-coach-care.base44.app/Profile",
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});