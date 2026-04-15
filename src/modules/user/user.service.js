import User from '../../db/models/User.js'
import { BadRequestError, NotFoundError } from '../../utils/api-errors.js'

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
  },

  /**
   * Updates user details (only allowed fields: name, address, profile_image_url).
   * @param {string} userId - User ID
   * @param {object} updateData - Data to update (name, address, profile_image_url)
   * @returns {Promise<object>} - Updated user data
   * @throws {NotFoundError} If user not found
   * @throws {BadRequestError} If trying to update restricted fields
   */
  doUpdateUser: async (userId, updateData) => {
    const user = await User.findByPk(userId)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Allowed fields to update
    const allowedFields = ['name', 'address', 'profile_image_url']
    // Restricted fields that cannot be updated
    const restrictedFields = ['phone', 'email', 'role', 'password', 'organization_id', 'is_active', 'is_verified']

    // Check if any restricted fields are being updated
    const attemptedRestrictedFields = restrictedFields.filter(field => field in updateData)
    if (attemptedRestrictedFields.length > 0) {
      throw new BadRequestError(`Cannot update restricted fields: ${attemptedRestrictedFields.join(', ')}`)
    }

    // Filter and update only allowed fields
    const filteredData = {}
    allowedFields.forEach(field => {
      if (field in updateData) {
        filteredData[field] = updateData[field]
      }
    })

    // Update user
    await user.update(filteredData)

    // Return updated user without password
    return await User.findByPk(userId, {
      attributes: {
        exclude: ['password']
      }
    })
  }
}

export default UserService
