import { faker } from '@faker-js/faker'
import AuthController from '../../../src/modules/auth/auth.controller'
import AuthService from '../../../src/modules/auth/auth.service'

describe('AuthController', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('signup', () => {
    it('should call the signup service with the full request object', async () => {
      expect.assertions(2)

      const httpRequest = {
        body: {
          full_name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.phone.phoneNumber('##########'),
          password: faker.internet.password(10),
          organization_name: faker.company.name()
        },
        ip: '127.0.0.1'
      }

      const signupData = {
        message: 'Verification code sent to email address'
      }

      const doSignupMock = jest.fn().mockResolvedValue(signupData)
      AuthService.doSignup = doSignupMock

      const result = await AuthController.signup(httpRequest)

      expect(result).toEqual({
        statusCode: 200,
        data: signupData
      })
      expect(doSignupMock).toHaveBeenCalledWith(httpRequest)
    })
  })

  describe('login', () => {
    it('should login user and return token', async () => {
      expect.assertions(2)

      const httpRequest = {
        body: {
          phone: faker.phone.phoneNumber('##########'),
          password: faker.internet.password(8)
        }
      }

      const loginData = {
        userId: 'fake-id',
        role: 'fake-role',
        accessToken: 'fake-access-token'
      }

      const doLoginMock = jest.fn().mockResolvedValue(loginData)
      AuthService.doLogin = doLoginMock

      const result = await AuthController.login(httpRequest)

      expect(result).toEqual({
        statusCode: 200,
        data: loginData
      })
      expect(doLoginMock).toHaveBeenCalledWith(httpRequest.body)
    })
  })
})