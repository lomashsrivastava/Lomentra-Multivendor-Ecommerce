/**
 * Centralised JWT secret resolver.
 *
 * Security rules:
 *  - In production: JWT_SECRET MUST be set via environment variables.
 *    If it is missing the process throws at start-up, preventing the API
 *    from ever running with a weak or predictable secret.
 *  - In development/test: falls back to a placeholder so local dev still works
 *    without needing a .env file.
 *
 * This means the fallback string is INTENTIONALLY never reachable in production
 * because the missing-secret check throws first.
 */

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProduction = nodeEnv === 'production'

const rawSecret = process.env.JWT_SECRET

if (isProduction && !rawSecret) {
  // Hard-fail at module load time so the Render/Netlify deploy surfaces the
  // misconfiguration immediately rather than silently using a weak key.
  throw new Error(
    '[SECURITY] JWT_SECRET environment variable is not set. ' +
      'Set a long, random string in your Render / deployment environment variables.'
  )
}

export const JWT_SECRET: string =
  rawSecret ?? 'dev_only_placeholder_not_used_in_production'
