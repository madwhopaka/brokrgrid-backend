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
  }
}

export default UserController
