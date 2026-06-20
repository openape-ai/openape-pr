// Dev-only: mint an HS256 CLI bearer token for local E2E (uses the dev session secret).
// Usage: node scripts/dev-token.mjs [agent|human] [email]
import { SignJWT } from 'jose'
const secret = new TextEncoder().encode('dev-session-secret-at-least-32-characters-long')
const act = process.argv[2] || 'agent'
const email = process.argv[3] || (act === 'agent' ? 'scribe@openape.ai' : 'patrick@hofmann.eco')
const t = await new SignJWT({ typ: 'cli', sub: email, email, act })
  .setProtectedHeader({ alg: 'HS256' }).setIssuer('pr.openape.ai').setAudience('pr.openape.ai')
  .setIssuedAt().setExpirationTime('1h').sign(secret)
process.stdout.write(t)
