import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Extrait l'utilisateur authentifié depuis le JWT dans l'Authorization header.
 * Throws une Response 401 si le token est absent ou invalide.
 */
export async function requireAuth(req: Request): Promise<{ id: string; email?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return user
}

/**
 * Vérifie que l'utilisateur est bien propriétaire d'un dog_id donné.
 * Utilise le client avec JWT (RLS) — si le dog n'est pas visible, accès refusé.
 */
export async function requireDogOwnership(
  authHeader: string,
  dogId: string,
): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await supabase
    .from('dogs')
    .select('id')
    .eq('id', dogId)
    .single()

  if (error || !data) {
    throw new Response(JSON.stringify({ error: 'Dog not found or access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
