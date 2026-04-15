import { sequelize } from '../../db/models/index.js'
import { isRedisHealthy } from '../../support/redis.js'

/**
 * Service to check the health status of the application and its dependencies.
 */
const AppHealthService = {
  /**
   * Checks the health status of the application, database, and Redis.
   * @returns {Promise<Object>} An object containing the health status of all components.
   */
  doGetAppHealth: async () => {
    const appHealthStatus = {
      app: { status: 'down' },
      database: { status: 'down' },
      redis: { status: 'down' }
    }

    // Check Database
    try {
      await sequelize.authenticate()
      appHealthStatus.database.status = 'up'
    } catch (error) {
      appHealthStatus.database.status = 'down'
      appHealthStatus.database.error = error.message
    }

    // Check Redis
    try {
      const redisHealthy = await isRedisHealthy()
      appHealthStatus.redis.status = redisHealthy ? 'up' : 'down'
    } catch (error) {
      appHealthStatus.redis.status = 'down'
      appHealthStatus.redis.error = error.message
    }

    // App is always up if this endpoint is reachable
    appHealthStatus.app.status = 'up'
    appHealthStatus.timestamp = new Date().toISOString()

    return appHealthStatus
  }
}

export default AppHealthService
