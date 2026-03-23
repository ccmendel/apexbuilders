import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type AdminSession = {
  email: string
  exp: number
}

export function getAdminCookieName() {
  return SESSION_COOKIE_NAME
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) {
    return false
  }

  const computedHash = scryptSync(password, salt, 64).toString('hex')
  return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'))
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured')
  }
  return secret
}

function signPayload(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
}

export function createSessionToken(email: string) {
  const payload: AdminSession = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signPayload(encoded)
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): AdminSession | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    return null
  }

  const expected = signPayload(encoded)
  if (signature.length !== expected.length) {
    return null
  }
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) {
    return null
  }

  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as AdminSession
  if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return payload
}
