import { sequelize } from '../db/models/index.js'
import { logger } from '../support/logger.js'

/**
 * Close the server and database connections and exit the process.
 * @param {import('http').Server} server - The server object to close.
 * @returns {Promise<void>} - A promise that resolves when the server and database connections are closed and the process is exited.
 */

const gracefulShutdown = async (server, afterShutdown = () => process.exit(0)) => {
  try {
    await sequelize.close()
    logger.info('Closed database connection!')

    await new Promise((resolve, reject) => {
      server.stop((err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    logger.info('HTTP server stopped')
    afterShutdown()
  } catch (error) {
    logger.error(error.message)
    process.exit(1)
  }
}

export default gracefulShutdown
