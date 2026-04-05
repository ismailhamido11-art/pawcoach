import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Vérifie et consomme 1 crédit message pour l'utilisateur courant.
 * Utilise la fonction SQL check_and_consume_message_credit() (WITH FOR UPDATE lock).
 * Throws une Response 429 si quota dépassé.
 */
export async function consumeMessageCredit(authHeader: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await supabase.rpc('check_and_consume_message_credit')

  if (error) throw new Error(`Quota check failed: ${error.message}`)

  if (!data) {
    throw new Response(
      JSON.stringify({ error: 'Message quota exceeded. Upgrade to premium for unlimited messages.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Vérifie si l'utilisateur dispose d'un crédit action, SANS consommer.
 * À appeler avant invokeLLM pour bloquer les appels LLM inutiles si quota dépassé.
 * Throws une Response 429 si quota dépassé.
 */
export async function checkActionCredit(authHeader: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await supabase.rpc('check_action_credit')

  if (error) throw new Error(`Quota check failed: ${error.message}`)

  if (!data) {
    throw new Response(
      JSON.stringify({ error: 'Action quota exceeded. Upgrade to premium for unlimited actions.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Vérifie et consomme 1 crédit action (analyses, diagnostics, etc.).
 * Throws une Response 429 si quota dépassé.
 */
export async function consumeActionCredit(authHeader: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await supabase.rpc('check_and_consume_action_credit')

  if (error) throw new Error(`Quota check failed: ${error.message}`)

  if (!data) {
    throw new Response(
      JSON.stringify({ error: 'Action quota exceeded. Upgrade to premium for unlimited actions.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Vérifie et consomme 1 crédit scan (limite hebdomadaire 3 scans pour free).
 * Throws une Response 429 si quota dépassé.
 */
export async function consumeScanCredit(authHeader: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await supabase.rpc('check_and_consume_scan_credit')

  if (error) throw new Error(`Quota check failed: ${error.message}`)

  if (!data) {
    throw new Response(
      JSON.stringify({ error: 'Scan quota exceeded (3/week on free plan). Upgrade to premium.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
