import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

const sendOtpEmailMock = jest.fn().mockResolvedValue({ sent: true })
const generateJwtMock = jest.fn().mockResolvedValue('fake-access-token')
const transactionMock = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined)
}

jest.mock('../../../src/modules/auth/auth.helpers.js', () => {
  const actual = jest.requireActual('../../../src/modules/auth/auth.helpers.js')
  return {
    ...actual,
    sendOtpEmail: (...args) => sendOtpEmailMock(...args)
  }
})

jest.mock('../../../src/modules/auth/jwt.service.js', () => ({
  generateJWT: (...args) => generateJwtMock(...args),
  verifyJWT: jest.fn()
}))

jest.mock('../../../src/db/models/index.js', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(transactionMock)
  }
}))

jest.mock('../../../src/db/models/User.js', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}))

jest.mock('../../../src/db/models/Organization.js', () => ({
  create: jest.fn()
}))

jest.mock('../../../src/db/models/PendingSignup.js', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}))

import AuthService from '../../../src/modules/auth/auth.service'
import User from '../../../src/db/models/User.js'
import Organization from '../../../src/db/models/Organization.js'
import PendingSignup from '../../../src/db/models/PendingSignup.js'

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('doLogin', () => {
    it('should login user and return token', async () => {
      expect.assertions(1)

      const requestBody = {
        phone: faker.phone.phoneNumber('##########'),
        password: faker.internet.password(8)
      }

      const fakeUser = {
        id: 'fake-id',
        role: 'fake-role',
        password: bcrypt.hashSync(requestBody.password, 10)
      }

      User.findOne.mockResolvedValue(fakeUser)

      const result = await AuthService.doLogin(requestBody)

      expect(result).toEqual({
        accessToken: 'fake-access-token',
        userId: 'fake-id',
        role: 'fake-role'
      })
    })
  })

  describe('doSignup', () => {
    it('should create a pending signup and send an OTP instead of creating a user', async () => {
      expect.assertions(4)

      User.findOne.mockResolvedValue(null)
      PendingSignup.findOne.mockResolvedValue(null)

      PendingSignup.create.mockImplementation(async (payload) => ({
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      }))

      const httpRequest = {
        body: {
          full_name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.phone.phoneNumber('##########'),
          password: faker.internet.password(10),
          organization_name: faker.company.name()
        },
        ip: '127.0.0.1',
        headers: {
          'User-Agent': 'jest'
        }
      }

      const result = await AuthService.doSignup(httpRequest)

      expect(PendingSignup.create).toHaveBeenCalledTimes(1)
      expect(User.findOne).toHaveBeenCalledTimes(1)
      expect(sendOtpEmailMock).toHaveBeenCalledTimes(1)
      expect(result.nextStep).toBe('verify-otp')
    })
  })

  describe('doVerifyOtp', () => {
    it('should create organization and verified user when otp matches', async () => {
      expect.assertions(6)

      const pendingSignup = {
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.phoneNumber('##########'),
        full_name: faker.name.fullName(),
        password_hash: bcrypt.hashSync('super-secret', 10),
        organization_name: faker.company.name(),
        otp_hash: bcrypt.hashSync('123456', 10),
        otp_expires_at: new Date(Date.now() + 300000),
        otp_attempt_count: 0,
        resend_count: 0,
        destroy: jest.fn().mockResolvedValue(undefined)
      }

      PendingSignup.findOne.mockResolvedValue(pendingSignup)

      const organizationUpdate = jest.fn().mockResolvedValue(undefined)
      Organization.create.mockResolvedValue({
        id: 'org-id',
        name: pendingSignup.organization_name,
        slug: 'org-slug',
        email: pendingSignup.email,
        update: organizationUpdate
      })

      User.create.mockResolvedValue({
        id: 'user-id',
        role: 'admin',
        name: pendingSignup.full_name,
        email: pendingSignup.email,
        phone: pendingSignup.phone
      })

      const result = await AuthService.doVerifyOtp({
        body: {
          email: pendingSignup.email,
          otp: '123456'
        },
        ip: '127.0.0.1'
      })

      expect(transactionMock.commit).toHaveBeenCalledTimes(1)
      expect(Organization.create).toHaveBeenCalledTimes(1)
      expect(User.create).toHaveBeenCalledTimes(1)
      expect(pendingSignup.destroy).toHaveBeenCalledTimes(1)
      expect(result.accessToken).toBe('fake-access-token')
      expect(generateJwtMock).toHaveBeenCalledTimes(1)
    })
  })
})