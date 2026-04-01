/**
 * Sanitize une chaîne pour éviter les injections XSS.
 * Tronque à max caractères si fourni.
 */
export function sanitize(s: unknown, max?: number): string {
  if (s === null || s === undefined) return ''

  let str = String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  if (max && str.length > max) {
    str = str.slice(0, max)
  }

  return str
}
