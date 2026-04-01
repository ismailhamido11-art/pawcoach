import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

// RevenueCat event types that affect subscription status
const PREMIUM_ACTIVATE_EVENTS = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION']
const PREMIUM_DEACTIVATE_EVENTS = ['EXPIRATION']
const STATUS_ONLY_EVENTS = ['CANCELLATION', 'BILLING_ISSUE', 'PRODUCT_CHANGE']

function mapEventToStatus(eventType: string): string {
  if (PREMIUM_ACTIVATE_EVENTS.includes(eventType)) return 'active'
  if (PREMIUM_DEACTIVATE_EVENTS.includes(eventType)) return 'expired'
  if (eventType === 'CANCELLATION') return 'cancelled'
  if (eventType === 'BILLING_ISSUE') return 'billing_issue'
  if (eventType === 'PRODUCT_CHANGE') return 'active'
  return 'unknown'
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Vérifier la signature webhook RevenueCat
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET not set')
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || authHeader !== webhookSecret) {
      console.warn('[revenuecat-webhook] Invalid webhook signature')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parser le body RevenueCat
    const payload = await req.json()
    const event = payload?.event

    if (!event) {
      return new Response(JSON.stringify({ error: 'Invalid payload: missing event' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const eventType: string = event.type
    const appUserId: string = event.app_user_id
    const productId: string = event.product_id
    const originalPurchaseDate: string | null = event.original_purchase_date_ms
      ? new Date(event.original_purchase_date_ms).toISOString()
      : null

    console.log(`[revenuecat-webhook] Event: ${eventType}, user: ${appUserId}`)

    const supabase = createServiceClient()

    // 3. Trouver le profil via revenuecat_app_user_id
    // Note: RevenueCat app_user_id = Supabase user UUID (configuré côté frontend avec Purchases.logIn(userId))
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_premium, subscription_status')
      .eq('id', appUserId)  // app_user_id = Supabase user UUID
      .single()

    if (profileError || !profile) {
      // Fallback: chercher via revenuecat_app_user_id si l'ID diffère
      const { data: profileFallback, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, is_premium, subscription_status')
        .eq('revenuecat_app_user_id', appUserId)
        .single()

      if (fallbackError || !profileFallback) {
        console.warn(`[revenuecat-webhook] Profile not found for app_user_id: ${appUserId}`)
        // Retourner 200 pour éviter que RevenueCat ne retente indéfiniment
        return new Response(JSON.stringify({ received: true, warning: 'profile not found' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await handleEvent(supabase, profileFallback.id, eventType, productId, originalPurchaseDate)
    } else {
      await handleEvent(supabase, profile.id, eventType, productId, originalPurchaseDate)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[revenuecat-webhook] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleEvent(
  supabase: any,
  userId: string,
  eventType: string,
  productId: string,
  originalPurchaseDate: string | null,
): Promise<void> {
  const updates: Record<string, any> = {
    subscription_status: mapEventToStatus(eventType),
    subscription_id: productId,
  }

  if (PREMIUM_ACTIVATE_EVENTS.includes(eventType)) {
    updates.is_premium = true
    if (originalPurchaseDate) {
      updates.premium_since = new Date(originalPurchaseDate).toISOString().split('T')[0]
    } else {
      updates.premium_since = new Date().toISOString().split('T')[0]
    }
    console.log(`[revenuecat-webhook] Activating premium for user ${userId}`)
  } else if (PREMIUM_DEACTIVATE_EVENTS.includes(eventType)) {
    updates.is_premium = false
    console.log(`[revenuecat-webhook] Deactivating premium for user ${userId}`)
  } else if (STATUS_ONLY_EVENTS.includes(eventType)) {
    // CANCELLATION: subscription_status='cancelled' mais is_premium reste true jusqu'à EXPIRATION
    // BILLING_ISSUE: garder is_premium true pendant 2 cycles (RevenueCat gère la grace period)
    console.log(`[revenuecat-webhook] Status-only update for user ${userId}: ${eventType}`)
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update profile ${userId}: ${error.message}`)
  }

  console.log(`[revenuecat-webhook] Profile ${userId} updated:`, updates)
}
