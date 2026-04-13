import User from '../../db/models/User.js'

const UserService = {
  /**
   * Fetches all users.
   * @returns {Promise<Array<object>>}
   */
  doGetUsers: async () => {
    const users = await User.findAll({
      attributes: {
        exclude: ['password']
      },
      order: [['created_at', 'DESC']]
    })

    return users
  },

  /**
   * Fetches a user by ID.
   * @param {string|number} userId
   * @returns {Promise<object>}
   */
  doGetUser: async (userId) => {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password']
      }
    })

    return user
  }
}

export default UserService
