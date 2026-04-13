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
  }
}

export default AuthController
