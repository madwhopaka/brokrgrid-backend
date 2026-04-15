import UserService from './user.service.js'
import { generateResponse } from '../../utils/helper.js'

const UserController = {
  /**
   * Returns all users.
   * @param {ExpressRequest} _httpRequest incoming request
   * @returns {Promise<ControllerResponse>}
   */
  getUsers: async (_httpRequest) => {
    const usersData = await UserService.doGetUsers()
    return generateResponse(usersData)
  },

  /**
   * Returns a user by ID.
   * @param {ExpressRequest} httpRequest incoming request
   * @returns {Promise<ControllerResponse>}
   */
  getUser: async (httpRequest) => {
    const { userId } = httpRequest.params
    const userData = await UserService.doGetUser(userId)
    return generateResponse(userData)
  },

  /**
   * Updates user details (name, address, profile image, etc).
   * @param {ExpressRequest} httpRequest incoming request
   * @returns {Promise<ControllerResponse>}
   */
  updateUser: async (httpRequest) => {
    const { userId } = httpRequest.params
    const updateData = httpRequest.body
    const userData = await UserService.doUpdateUser(userId, updateData)
    return generateResponse(userData)
  }
}

export default UserController
