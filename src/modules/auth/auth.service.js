/* eslint-disable camelcase */
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import User from '../../db/models/User.js'
import Organization from '../../db/models/Organization.js'
import { generateJWT } from './jwt.service.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/api-errors.js'
import { storeOTP, verifyOTP } from '../../utils/otp-helper.js'
import mailService from '../../support/mail.js'

/**
 * AuthService module to handle authentication related operations.
 * @module AuthService
 */
const AuthService = {
  /**
   * Signs up a new user and creates an organization.
   * @async
   * @function
   * @param {Object} requestBody - Request Body
    * @returns {Promise<Object>} Signup success response
    * @throws {BadRequestError} If user already exists.
   */
  doSignup: async (requestBody) => {
    const {
      email,
      name,
      phone,
      password,
      organization_name,
      organization_slug,
      address,
      city,
      state,
      country,
      organization_phone
    } = requestBody

    // Check if user already exists by phone or email
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }]
      }
    })
    if (existingUser) {
      throw new BadRequestError('User with this phone number or email already exists!')
    }

    // Create organization only if it does not exist
    let organization = await Organization.findOne({
      where: { slug: organization_slug }
    })

    if (!organization) {
      organization = await Organization.create({
        name: organization_name,
        slug: organization_slug,
        address,
        city,
        state,
        country,
        phone_number: organization_phone,
        email,
        plan: 'free',
        subscription_status: 'active',
        is_active: true,
        members_count: 1
      })
    }

    // Create User
    const hashedPassword = bcrypt.hashSync(password, 10)
    const user = await User.create({
      organization_id: organization.id,
      email,
      name,
      phone,
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      is_verified: false
    })

    // Set created_by only if not already set
    if (!organization.created_by) {
      await organization.update({ created_by: user.id })
    }

    // Send OTP mail for verification after signup
    const otp = await storeOTP(email)
    await mailService.sendOTPEmail(email, otp)

    return {
      message: 'Sign up Successfull'
    }
  },

  doLogin: async (requestBody) => {
    const { phone, email, password } = requestBody
    const user = await User.findOne({
      where: email ? { email } : { phone }
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (!user.is_verified) {
      throw new ForbiddenError('Please verify your email before logging in')
    }

    const isValidPass = bcrypt.compareSync(password, user.password)
    if (!isValidPass) {
      throw new BadRequestError('Username or Password is invalid!')
    }

    const payload = {
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id
    }

    const accessToken = await generateJWT({
      payload
    })
    // Get organization data
    const organization = await Organization.findByPk(user.organization_id)

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified,
        first_login: user.first_login,
        last_login_at: user.last_login_at,
        profile_image_url: user.profile_image_url,
        organization_id: user.organization_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        email: organization.email,
        phone_number: organization.phone_number,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        country: organization.country
      }
    }
  },

  /**
   * Send OTP to email for verification
   * @async
   * @param {Object} requestBody - { email }
   * @returns {Promise<Object>} { success: boolean, message: string, email: string }
   * @throws {BadRequestError} If email is not provided
   */
  doSendOTP: async (requestBody) => {
    const { email } = requestBody

    if (!email) {
      throw new BadRequestError('Email is required')
    }

    // Generate and store OTP in Redis
    const otp = await storeOTP(email)

    // Send OTP via real SMTP mail service
    await mailService.sendOTPEmail(email, otp)

    return {
      success: true,
      message: 'OTP sent successfully to your email',
      email
    }
  },

  /**
   * Verify OTP stored in Redis
   * @async
   * @param {Object} requestBody - { email, otp }
    * @returns {Promise<Object>} { success: boolean, message: string, accessToken: string, user: object }
   * @throws {BadRequestError} If verification fails
   */
  doVerifyOTP: async (requestBody) => {
    const { email, otp } = requestBody

    if (!email || !otp) {
      throw new BadRequestError('Email and OTP are required')
    }

    // Verify OTP from Redis
    const result = await verifyOTP(email, otp)

    if (!result.isValid) {
      throw new BadRequestError(result.message)
    }

    const user = await User.findOne({
      where: { email }
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    await user.update({ is_verified: true })

    const payload = {
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id
    }

    const accessToken = await generateJWT({ payload })

    return {
      success: true,
      message: result.message,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        is_active: user.is_active,
        is_verified: true,
        first_login: user.first_login,
        last_login_at: user.last_login_at,
        profile_image_url: user.profile_image_url,
        organization_id: user.organization_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }
  }
}

export default AuthService
