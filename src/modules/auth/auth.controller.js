import AuthService from './auth.service.js'
import { generateResponse } from '../../utils/helper.js'

const AuthController = {
  /**
   * Handle signing up a new user.
   * @async
   * @function
   * @param {ExpressRequest} httpRequest incoming http request
   * @returns {Promise.<ControllerResponse> }
   */
  signup: async (httpRequest) => {
    const signupData = await AuthService.doSignup(httpRequest.body)
    return generateResponse(signupData)
  },

  /**
   * Handle logging in user.
   * @async
   * @function
   * @param {ExpressRequest} httpRequest incoming http request
   * @returns {Promise.<ControllerResponse> }
   */
  login: async (httpRequest) => {
    const loginData = await AuthService.doLogin(httpRequest.body)
    return generateResponse(loginData)
  },

  /**
   * Send OTP to email for verification.
   * @async
   * @function
   * @param {ExpressRequest} httpRequest incoming http request
   * @returns {Promise.<ControllerResponse> }
   */
  sendOTP: async (httpRequest) => {
    const otpData = await AuthService.doSendOTP(httpRequest.body)
    return generateResponse(otpData)
  },

  /**
   * Verify OTP sent to email.
   * @async
   * @function
   * @param {ExpressRequest} httpRequest incoming http request
   * @returns {Promise.<ControllerResponse> }
   */
  verifyOTP: async (httpRequest) => {
    const verifyData = await AuthService.doVerifyOTP(httpRequest.body)
    return generateResponse(verifyData)
  }
}

export default AuthController
