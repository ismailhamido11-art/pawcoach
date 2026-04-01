import { corsHeaders } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import { requireAuth } from '../_shared/auth.ts'

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

  console.log('[delete-user] Request received')

  try {
    // 1. Authentifier l'utilisateur
    let user: { id: string; email?: string }
    try {
      user = await requireAuth(req)
    } catch (authResponse) {
      return authResponse as Response
    }

    console.log(`[delete-user] Authenticated user: ${user.id}`)

    const supabase = createServiceClient()

    // 2. Récupérer le profil pour vérifier l'abonnement RevenueCat actif
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_premium, revenuecat_app_user_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(`[delete-user] Failed to fetch profile for ${user.id}:`, profileError.message)
      // On continue quand même — l'utilisateur doit pouvoir se supprimer
    }

    console.log(`[delete-user] Profile fetched. is_premium=${profile?.is_premium}, subscription_status=${profile?.subscription_status}`)

    // 3. Révoquer l'abonnement RevenueCat si actif
    if (profile?.is_premium && profile?.subscription_status === 'active') {
      const rcApiKey = Deno.env.get('REVENUECAT_API_KEY')
      if (!rcApiKey) {
        console.error('[delete-user] REVENUECAT_API_KEY not set — skipping RevenueCat revocation')
      } else {
        const rcUserId = profile.revenuecat_app_user_id || user.id
        console.log(`[delete-user] Revoking RevenueCat subscription for user: ${rcUserId}`)

        try {
          const rcRes = await fetch(
            `https://api.revenuecat.com/v1/subscribers/${rcUserId}/subscriptions`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${rcApiKey}`,
                'Content-Type': 'application/json',
                'X-Platform': 'stripe',
              },
            },
          )

          if (!rcRes.ok) {
            console.error(`[delete-user] RevenueCat subscription fetch failed: ${rcRes.status}`)
          } else {
            // Marquer le subscriber comme supprimé dans RevenueCat
            const deleteRes = await fetch(
              `https://api.revenuecat.com/v1/subscribers/${rcUserId}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${rcApiKey}`,
                  'Content-Type': 'application/json',
                },
              },
            )
            if (!deleteRes.ok) {
              console.error(`[delete-user] RevenueCat subscriber delete failed: ${deleteRes.status}`)
            } else {
              console.log(`[delete-user] RevenueCat subscriber deleted: ${rcUserId}`)
            }
          }
        } catch (rcErr) {
          // Ne jamais bloquer la suppression RGPD à cause de RevenueCat
          console.error('[delete-user] RevenueCat error (non-blocking):', rcErr)
        }
      }
    }

    // 4. RGPD: Supprimer les fichiers Storage (pas gere par CASCADE — S3 != DB)
    const storageBuckets = ['dog-photos', 'food-scans', 'growth-photos', 'health-docs', 'chat-images']
    for (const bucket of storageBuckets) {
      try {
        const { data: items } = await supabase.storage.from(bucket).list(user.id, { limit: 1000 })
        if (!items || items.length === 0) continue

        const paths: string[] = []
        for (const item of items) {
          if (item.id) {
            paths.push(`${user.id}/${item.name}`)
          } else {
            const { data: subItems } = await supabase.storage
              .from(bucket)
              .list(`${user.id}/${item.name}`, { limit: 1000 })
            if (subItems) {
              paths.push(...subItems.filter((s: any) => s.id).map((s: any) => `${user.id}/${item.name}/${s.name}`))
            }
          }
        }

        if (paths.length > 0) {
          await supabase.storage.from(bucket).remove(paths)
          console.log(`[delete-user] Deleted ${paths.length} files from ${bucket}`)
        }
      } catch (e) {
        console.error(`[delete-user] Storage cleanup error (${bucket}):`, e)
      }
    }

    // 5. Supprimer l'utilisateur Supabase Auth
    // Les CASCADE sur toutes les FK font le reste (DB rows only)
    console.log(`[delete-user] Deleting Supabase auth user: ${user.id}`)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error(`[delete-user] CRITICAL: Failed to delete auth user ${user.id}:`, deleteError.message)
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log(`[delete-user] User ${user.id} deleted successfully. All data cascaded.`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account and all data deleted successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('[delete-user] Unhandled error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
