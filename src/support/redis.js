/**
 * Redis Client Configuration and Connection
 * Provides a singleton Redis client instance
 */

import { createClient } from 'redis'
import config from 'config'
import { logger } from './logger.js'

let redisClient = null
let isConnecting = false
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 3

/**
 * Get or create Redis client
 * @returns {Promise<object>} Redis client instance
 * @throws {Error} If connection fails after max attempts
 */
export const getRedisClient = async () => {
  // Return existing client if already connected
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  // Prevent multiple connection attempts
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      const checkConnection = setInterval(() => {
        if (redisClient && redisClient.isOpen) {
          clearInterval(checkConnection)
          resolve(redisClient)
        }
        // Stop checking after 30 seconds
        if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
          clearInterval(checkConnection)
          reject(new Error('Redis connection failed'))
        }
      }, 100)
    })
  }

  isConnecting = true
  connectionAttempts++

  try {
    const redisConfig = config.get('redis') || {}

    const clientConfig = {
      url: redisConfig.url || process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > MAX_CONNECTION_ATTEMPTS) {
            return new Error('Redis max retries exceeded')
          }
          const delay = Math.min(retries * 50, 500)
          return delay
        },
        connectTimeout: redisConfig.connectTimeout || 10000,
        keepAlive: redisConfig.keepAlive !== false ? 30000 : false
      },
      password: redisConfig.password || process.env.REDIS_PASSWORD,
      db: redisConfig.db || 0
    }

    // Remove password if not provided
    if (!clientConfig.password) {
      delete clientConfig.password
    }

    redisClient = createClient(clientConfig)

    // Handle connection events
    redisClient.on('error', (error) => {
      const errorMsg = error.message || error.toString()
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Connection refused')) {
        logger.error('❌ Redis Connection Failed - Server not running')
        logger.warn('📝 For Development: Start Redis with:')
        logger.warn('• Docker: docker run -d -p 6379:6379 redis:latest')
        logger.warn('• WSL: wsl redis-server')
        logger.warn('• Or download from: https://redis.io/download')
      } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        logger.error('❌ Redis Network Error - Cannot resolve host')
        logger.error(`   Host: ${redisConfig.url || 'localhost:6379'}`)
      } else if (errorMsg.includes('WRONGPASS') || errorMsg.includes('ERR invalid password')) {
        logger.error('❌ Redis Authentication Failed - Invalid password')
      } else {
        logger.error(`❌ Redis Client Error: ${errorMsg}`)
      }
    })

    redisClient.on('connect', () => {
      logger.info('✅ Redis client connected successfully')
      isConnecting = false
      connectionAttempts = 0
    })

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready')
    })

    redisClient.on('reconnecting', () => {
      logger.warn(`⚠️  Redis reconnecting... (Attempt ${connectionAttempts})`)
    })

    redisClient.on('end', () => {
      logger.warn('⚠️  Redis client connection ended')
    })

    // Connect to Redis
    await redisClient.connect()

    logger.info(`✅ Redis connected to (DB: ${clientConfig.db})`)
    isConnecting = false
    connectionAttempts = 0

    return redisClient
  } catch (error) {
    isConnecting = false
    const errorMsg = error.message || error.toString()
    logger.error('❌ Failed to connect to Redis:', errorMsg)

    if (errorMsg.includes('ECONNREFUSED')) {
      logger.error('📝 Redis server is not running!')
      logger.error('For Development, start Redis:')
      logger.error('  docker run -d -p 6379:6379 redis:latest')
    }

    // Don't throw - allow app to continue without Redis
    logger.warn('⚠️  App continuing without Redis - OTP features will not work')
    return null
  }
}

/**
 * Disconnect Redis client
 * @returns {Promise<void>}
 */
export const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect()
    logger.info('Redis client disconnected')
    redisClient = null
  }
}

/**
 * Health check for Redis connection
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const isRedisHealthy = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false
    }
    await redisClient.ping()
    return true
  } catch (error) {
    logger.debug('Redis health check failed:', error.message)
    return false
  }
}

/**
 * Get Redis info
 * @returns {Promise<string>} Redis server info
 */
export const getRedisInfo = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return null
    }
    return await redisClient.info()
  } catch (error) {
    logger.error('Error getting Redis info:', error.message)
    return null
  }
}

export default {
  getRedisClient,
  disconnectRedis,
  isRedisHealthy,
  getRedisInfo
}
