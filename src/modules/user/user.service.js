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
  }
}

export default UserService
