import 'dotenv/config'
/* eslint-disable space-before-function-paren */
import http from 'http'
import app from './app.js'
import normalizePort from './utils/normalize-port.js'
import gracefulShutdown from './utils/graceful-shutdown.js'
import { logger } from './support/logger.js'
import { initDB } from './db/models/index.js'
import { getRedisClient } from './support/redis.js'

/* eslint-disable no-console */

/**
 * Start the server
 */
async function startServer() {
  /**
   * Initialize database connection
   */
  await initDB()

  /**
   * Initialize Redis connection
   */
  try {
    await getRedisClient()
  } catch (error) {
    logger.error('Redis initialization failed:', error.message)
    logger.warn('Continuing without Redis - some features may not work')
  }

  /**
   * Get port from environment and store in Express.
   */
  const port = normalizePort(process.env.PORT || '3000')
  app.set('port', port)

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app)

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port)

  /**
   * Handle server errors.
   * @param {Error} error - The error to handle.
   * @throws {Error} - If the error is not a listen error or is not a known error code.
   */
  function onError (error) {
    if (error.syscall !== 'listen') {
      throw error
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`)
        process.exit(1)
        break
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`)
        process.exit(1)
        break
      default:
        throw error
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening () {
    const addr = server.address()
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
    console.info(`Listening on ${bind} in ${process.env.NODE_ENV} environment`)
  }

  server.on('error', onError)
  server.on('listening', onListening)
}

// quit on ctrl+c when running docker in terminal
process.on('SIGINT', async () => {
  logger.info(
    'Got SIGINT (aka ctrl+c in docker). Graceful shutdown',
    new Date().toISOString()
  )
  await gracefulShutdown()
})

// quit properly on docker stop
process.on('SIGTERM', async () => {
  logger.info(
    'Got SIGTERM (docker container stop). Graceful shutdown',
    new Date().toISOString()
  )
  await gracefulShutdown()
})

process.once('SIGUSR2', async () => {
  await gracefulShutdown({
    exit: () => process.kill(process.pid, 'SIGUSR2') // let nodemon know it's safe to restart
  })
})

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})
