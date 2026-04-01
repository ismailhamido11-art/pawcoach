const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export interface PushMessage {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

/**
 * Envoie des notifications push via l'API Expo Push.
 * Gère DeviceNotRegistered silencieusement (token périmé).
 * Retourne les tickets Expo pour chaque token.
 */
export async function sendPush(msg: PushMessage): Promise<ExpoPushTicket[]> {
  if (!msg.tokens || msg.tokens.length === 0) return []

  const messages = msg.tokens.map((token) => ({
    to: token,
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
    sound: 'default',
  }))

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Expo Push API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  const tickets: ExpoPushTicket[] = json.data ?? []

  // Log DeviceNotRegistered pour nettoyage ultérieur (sans bloquer)
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i]
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      console.warn(`[send-push] DeviceNotRegistered for token: ${msg.tokens[i]}`)
    }
  }

  return tickets
}
