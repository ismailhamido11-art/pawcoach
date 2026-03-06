import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.3.1';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing stripe-signature header or STRIPE_WEBHOOK_SECRET env var");
      return new Response("Configuration error", { status: 500 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        console.log(`Skipping session with payment_status: ${session.payment_status}`);
        return Response.json({ received: true });
      }

      const userEmail = session.metadata?.user_email || session.customer_email;
      if (!userEmail) {
        console.error("No user email in session metadata");
        return Response.json({ received: true });
      }

      // Find the user and update premium status
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          is_premium: true,
          premium_since: new Date().toISOString().split("T")[0],
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        });
        console.log(`Premium activated for: ${userEmail}`);
      } else {
        console.error(`User not found: ${userEmail}`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by stripe_customer_id
      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          is_premium: false,
          stripe_subscription_id: null,
        });
        console.log(`Premium cancelled for customer: ${customerId}`);
      } else {
        console.error(`No user found for customer: ${customerId}`);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        await base44.asServiceRole.entities.User.update(users[0].id, {
          is_premium: isActive,
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
        });
        console.log(`Subscription updated for customer ${customerId}: status=${subscription.status}, premium=${isActive}`);
      } else {
        console.error(`No user found for subscription update customer: ${customerId}`);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const attemptCount = invoice.attempt_count || 1;

      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        if (attemptCount >= 3) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            is_premium: false,
            stripe_subscription_status: "past_due",
          });
          console.log(`Premium revoked (${attemptCount} failed payments) for customer: ${customerId}`);
        } else {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            stripe_subscription_status: "past_due",
          });
          console.log(`Payment failed (attempt ${attemptCount}/3) for customer: ${customerId}, keeping premium access`);
        }
      } else {
        console.error(`No user found for failed payment customer: ${customerId}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});