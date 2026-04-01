import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Client Supabase avec service_role_key — bypass RLS.
 * Utiliser uniquement dans les Edge Functions CRONs et opérations admin.
 */
export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

/**
 * Client Supabase avec le JWT de l'utilisateur — RLS appliqué.
 */
export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}
