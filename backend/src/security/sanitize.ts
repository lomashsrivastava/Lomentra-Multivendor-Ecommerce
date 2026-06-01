/**
 * Sanitizes an input string to protect against basic XSS attacks by escaping HTML entities.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizes an object recursively to protect against NoSQL injection.
 * Recursively strips out any object keys that begin with '$'.
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    if (typeof input === 'string') {
      return sanitizeString(input) as unknown as T
    }
    return input
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as unknown as T
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    // Prevent NoSQL operator injection by omitting keys starting with $
    if (key.startsWith('$')) {
      continue
    }
    sanitized[key] = sanitizeObject(value)
  }

  return sanitized as T
}
