import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import config from 'config'

const OTP_LENGTH = 6

export const OTP_TTL_MS = 5 * 60 * 1000
export const PENDING_SIGNUP_TTL_MS = 24 * 60 * 60 * 1000
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_MAX_RESENDS = 5
export const IP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const IP_RATE_LIMIT_MAX = 20

const rateLimitState = new Map()

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export const normalizeSignupPayload = (payload = {}) => {
  const fullName = payload.full_name || payload.name

  return {
    full_name: String(fullName || '').trim(),
    email: normalizeEmail(payload.email),
    phone: payload.phone ? String(payload.phone).trim() : null,
    password: payload.password,
    organization_name: String(payload.organization_name || '').trim()
  }
}

export const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(OTP_LENGTH, '0')

export const hashSecret = (value) => bcrypt.hashSync(String(value), 10)

export const compareSecret = (value, hash) => bcrypt.compareSync(String(value), String(hash))

export const buildOrganizationSlug = (name) => {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  const suffix = crypto.randomUUID().split('-')[0]
  return `${base || 'organization'}-${suffix}`
}

export const getRequestMetadata = (httpRequest = {}) => {
  const headers = httpRequest.headers || {}

  return {
    ipAddress: httpRequest.ip || null,
    userAgent: headers['User-Agent'] || headers['user-agent'] || null
  }
}

export const assertIpRateLimit = (scope, ipAddress) => {
  if (!ipAddress) {
    return
  }

  const key = `${scope}:${ipAddress}`
  const now = Date.now()
  const entry = rateLimitState.get(key)

  if (!entry || now - entry.windowStart >= IP_RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(key, {
      windowStart: now,
      count: 1
    })
    return
  }

  if (entry.count >= IP_RATE_LIMIT_MAX) {
    throw new Error('Too many requests from this IP address. Please try again later.')
  }

  entry.count += 1
  rateLimitState.set(key, entry)
}

export const clearExpiredRateLimitState = () => {
  const now = Date.now()

  for (const [key, entry] of rateLimitState.entries()) {
    if (now - entry.windowStart >= IP_RATE_LIMIT_WINDOW_MS) {
      rateLimitState.delete(key)
    }
  }
}

export const createOtpTransport = () => {
  const host = process.env.SMTP_HOST || config.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || config.SMTP_PORT || 0)
  const user = process.env.SMTP_USER || config.SMTP_USER
  const pass = process.env.SMTP_PASS || config.SMTP_PASS

  if (!host || !port || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || config.SMTP_SECURE || 'false') === 'true',
    auth: {
      user,
      pass
    }
  })
}

export const sendOtpEmail = async ({ email, fullName, otp }) => {
  const transport = createOtpTransport()

  if (!transport) {
    return { sent: false }
  }

  const from = process.env.SMTP_FROM || config.SMTP_FROM || process.env.SMTP_USER || config.SMTP_USER
  await transport.sendMail({
    from,
    to: email,
    subject: 'Verify your email address',
    text: `Hi ${fullName}, your verification code is ${otp}. It expires in 5 minutes.`,
    html: `<p>Hi ${fullName},</p><p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in 5 minutes.</p>`
  })

  return { sent: true }
}

export const getPendingSignupExpiry = (now = new Date()) => new Date(now.getTime() + PENDING_SIGNUP_TTL_MS)

export const getOtpExpiry = (now = new Date()) => new Date(now.getTime() + OTP_TTL_MS)
