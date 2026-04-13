/* eslint-disable camelcase */
import bcrypt from 'bcryptjs'
import User from '../../db/models/User.js'
import Organization from '../../db/models/Organization.js'
import { generateJWT } from './jwt.service.js'
import { BadRequestError, NotFoundError } from '../../utils/api-errors.js'

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
   * @returns {Promise<Object>} Context object containing accessToken, user, and organization data
   * @throws {BadRequestError} If phone number or slug already exists.
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

    // Check if user phone already exists
    const existingUser = await User.findOne({
      where: { phone }
    })
    if (existingUser) {
      throw new BadRequestError('User with this phone number already exists!')
    }

    // Check if slug already exists
    const existingOrg = await Organization.findOne({
      where: { slug: organization_slug }
    })
    if (existingOrg) {
      throw new BadRequestError('Organization slug already exists!')
    }

    // Create Organization
    const organization = await Organization.create({
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

    // Update organization created_by
    await organization.update({ created_by: user.id })

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

  doLogin: async (requestBody) => {
    const { phone, password } = requestBody
    const user = await User.findOne({
      where: {
        phone
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
  }
}

export default AuthService
