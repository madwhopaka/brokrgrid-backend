/* eslint-disable camelcase */
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { sequelize } from '../../db/models/index.js'
import User from '../../db/models/User.js'
import Organization from '../../db/models/Organization.js'
import PendingSignup from '../../db/models/PendingSignup.js'
import { generateJWT } from './jwt.service.js'
import { BadRequestError, NotFoundError } from '../../utils/api-errors.js'
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  OTP_RESEND_COOLDOWN_MS,
  assertIpRateLimit,
  buildOrganizationSlug,
  compareSecret,
  generateOtp,
  getOtpExpiry,
  getPendingSignupExpiry,
  getRequestMetadata,
  hashSecret,
  normalizeEmail,
  normalizeSignupPayload,
  sendOtpEmail
} from './auth.helpers.js'

const toApiError = (error, fallbackMessage) => {
  if (error instanceof BadRequestError || error instanceof NotFoundError) {
    return error
  }

  return new BadRequestError(error?.message || fallbackMessage)
}

const requirePendingSignup = async (email) => {
  const pendingSignup = await PendingSignup.findOne({
    where: { email }
  })

  if (!pendingSignup) {
    throw new NotFoundError('Pending signup not found')
  }

  if (pendingSignup.expires_at && new Date(pendingSignup.expires_at).getTime() <= Date.now()) {
    await pendingSignup.destroy()
    throw new BadRequestError('Pending signup has expired')
  }

  return pendingSignup
}

const assertPendingOtpState = (pendingSignup) => {
  if (pendingSignup.otp_attempt_count >= OTP_MAX_ATTEMPTS) {
    throw new BadRequestError('OTP attempt limit exceeded. Please request a new code.')
  }
}

const sendPendingOtp = async (pendingSignup, { resend = false } = {}) => {
  const otp = generateOtp()
  const otpHash = hashSecret(otp)
  const now = new Date()

  pendingSignup.otp_hash = otpHash
  pendingSignup.otp_expires_at = getOtpExpiry(now)
  pendingSignup.last_otp_sent_at = now
  pendingSignup.expires_at = getPendingSignupExpiry(now)

  if (!resend) {
    pendingSignup.resend_count = 0
    pendingSignup.otp_attempt_count = 0
  }

  await pendingSignup.save()
  await sendOtpEmail({
    email: pendingSignup.email,
    fullName: pendingSignup.full_name,
    otp
  })

  return otp
}

const createOrganizationAndUser = async (pendingSignup) => {
  const transaction = await sequelize.transaction()

  try {
    const organization = await Organization.create({
      name: pendingSignup.organization_name,
      slug: buildOrganizationSlug(pendingSignup.organization_name),
      address: null,
      city: null,
      state: null,
      country: null,
      phone_number: pendingSignup.phone,
      email: pendingSignup.email,
      plan: 'free',
      subscription_status: 'active',
      is_active: true,
      members_count: 1
    }, { transaction })

    const user = await User.create({
      organization_id: organization.id,
      email: pendingSignup.email,
      name: pendingSignup.full_name,
      phone: pendingSignup.phone,
      password: pendingSignup.password_hash,
      role: 'admin',
      is_active: true,
      is_verified: true,
      email_verified_at: new Date()
    }, { transaction })

    await organization.update({ created_by: user.id }, { transaction })
    await pendingSignup.destroy({ transaction })

    await transaction.commit()

    return { organization, user }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

const AuthService = {
  doSignup: async (httpRequest) => {
    const requestBody = httpRequest.body || httpRequest
    const { ipAddress, userAgent } = getRequestMetadata(httpRequest)
    const signupData = normalizeSignupPayload(requestBody)

    try {
      assertIpRateLimit('signup', ipAddress)
    } catch (error) {
      throw new BadRequestError(error.message)
    }

    if (!signupData.full_name || !signupData.email || !signupData.phone || !signupData.password || !signupData.organization_name) {
      throw new BadRequestError('Missing required signup fields')
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: signupData.email },
          { phone: signupData.phone }
        ]
      }
    })

    if (existingUser) {
      throw new BadRequestError('A verified account already exists with this email or phone number')
    }

    const now = new Date()
    let pendingSignup = await PendingSignup.findOne({
      where: { email: signupData.email }
    })

    const otp = generateOtp()
    const otpHash = hashSecret(otp)
    const passwordHash = bcrypt.hashSync(signupData.password, 10)

    if (pendingSignup) {
      pendingSignup.full_name = signupData.full_name
      pendingSignup.phone = signupData.phone
      pendingSignup.password_hash = passwordHash
      pendingSignup.organization_name = signupData.organization_name
      pendingSignup.otp_hash = otpHash
      pendingSignup.otp_expires_at = getOtpExpiry(now)
      pendingSignup.otp_attempt_count = 0
      pendingSignup.resend_count = 0
      pendingSignup.last_otp_sent_at = now
      pendingSignup.ip_address = ipAddress
      pendingSignup.user_agent = userAgent
      pendingSignup.expires_at = getPendingSignupExpiry(now)
      await pendingSignup.save()
    } else {
      pendingSignup = await PendingSignup.create({
        email: signupData.email,
        phone: signupData.phone,
        full_name: signupData.full_name,
        password_hash: passwordHash,
        organization_name: signupData.organization_name,
        otp_hash: otpHash,
        otp_expires_at: getOtpExpiry(now),
        otp_attempt_count: 0,
        resend_count: 0,
        last_otp_sent_at: now,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: getPendingSignupExpiry(now)
      })
    }

    await sendOtpEmail({
      email: pendingSignup.email,
      fullName: pendingSignup.full_name,
      otp
    })

    return {
      message: 'Verification code sent to email address',
      email: pendingSignup.email,
      nextStep: 'verify-otp',
      otpExpiresAt: pendingSignup.otp_expires_at,
      resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS)
    }
  },

  doVerifyOtp: async (httpRequest) => {
    const requestBody = httpRequest.body || httpRequest
    const email = normalizeEmail(requestBody.email)
    const otp = String(requestBody.otp || '').trim()
    const { ipAddress } = getRequestMetadata(httpRequest)

    try {
      assertIpRateLimit('verify-otp', ipAddress)
    } catch (error) {
      throw new BadRequestError(error.message)
    }

    const pendingSignup = await requirePendingSignup(email)
    assertPendingOtpState(pendingSignup)

    if (!pendingSignup.otp_expires_at || new Date(pendingSignup.otp_expires_at).getTime() <= Date.now()) {
      throw new BadRequestError('OTP has expired. Please request a new code.')
    }

    if (!compareSecret(otp, pendingSignup.otp_hash)) {
      pendingSignup.otp_attempt_count += 1
      await pendingSignup.save()
      throw new BadRequestError('Invalid OTP')
    }

    const { organization, user } = await createOrganizationAndUser(pendingSignup)

    const payload = {
      userId: user.id,
      role: user.role,
      organizationId: organization.id
    }

    const accessToken = await generateJWT({
      payload
    })

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: organization.id
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        email: organization.email
      }
    }
  },

  doResendOtp: async (httpRequest) => {
    const requestBody = httpRequest.body || httpRequest
    const email = normalizeEmail(requestBody.email)
    const pendingSignup = await requirePendingSignup(email)

    if (pendingSignup.resend_count >= OTP_MAX_RESENDS) {
      throw new BadRequestError('OTP resend limit exceeded')
    }

    if (pendingSignup.last_otp_sent_at) {
      const elapsed = Date.now() - new Date(pendingSignup.last_otp_sent_at).getTime()
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        throw new BadRequestError('Please wait before requesting another OTP')
      }
    }

    pendingSignup.resend_count += 1
    pendingSignup.otp_attempt_count = 0

    await sendPendingOtp(pendingSignup, { resend: true })

    return {
      message: 'Verification code resent',
      email: pendingSignup.email,
      nextStep: 'verify-otp',
      otpExpiresAt: pendingSignup.otp_expires_at,
      resendAvailableAt: new Date(Date.now() + OTP_RESEND_COOLDOWN_MS)
    }
  },

  doChangeEmail: async (httpRequest) => {
    const requestBody = httpRequest.body || httpRequest
    const currentEmail = normalizeEmail(requestBody.email)
    const newEmail = normalizeEmail(requestBody.new_email)

    if (!newEmail) {
      throw new BadRequestError('New email is required')
    }

    const existingUser = await User.findOne({
      where: { email: newEmail }
    })

    if (existingUser) {
      throw new BadRequestError('A verified account already exists with the new email address')
    }

    const conflictPending = await PendingSignup.findOne({
      where: { email: newEmail }
    })

    if (conflictPending && conflictPending.email !== currentEmail) {
      throw new BadRequestError('A pending signup already exists with the new email address')
    }

    const pendingSignup = await requirePendingSignup(currentEmail)

    pendingSignup.email = newEmail
    pendingSignup.otp_attempt_count = 0
    pendingSignup.resend_count = 0

    await sendPendingOtp(pendingSignup, { resend: false })

    return {
      message: 'Email updated and verification code resent',
      email: pendingSignup.email,
      nextStep: 'verify-otp',
      otpExpiresAt: pendingSignup.otp_expires_at,
      resendAvailableAt: new Date(Date.now() + OTP_RESEND_COOLDOWN_MS)
    }
  },

  doLogin: async (requestBody) => {
    const { phone, email, password } = requestBody
    const normalizedEmail = normalizeEmail(email)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          phone ? { phone } : null,
          normalizedEmail ? { email: normalizedEmail } : null
        ].filter(Boolean)
      }
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    const isValidPass = bcrypt.compareSync(password, user.password)
    if (!isValidPass) {
      throw new BadRequestError('Username or Password is invalid!')
    }

    const payload = {
      userId: user.id,
      role: user.role
    }

    const accessToken = await generateJWT({
      payload
    })
    return {
      accessToken,
      ...payload
    }
  }
}

export default AuthService