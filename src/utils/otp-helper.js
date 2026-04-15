/**
 * OTP Manager using Redis
 * OTP stored in Redis with automatic expiry (stateless and scalable)
 */
import { getRedisClient } from '../support/redis.js'
import { logger } from '../support/logger.js'

const OTP_EXPIRY_SECONDS = 10 * 60 // 10 minutes
const MAX_ATTEMPTS = 5

/**
 * Generate a random OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP in Redis with email as key
 * @param {string} email - Email address
 * @returns {Promise<string>} Generated OTP
 * @throws {Error} If Redis operation fails
 */
const storeOTP = async (email) => {
  try {
    const otp = generateOTP()
    const client = await getRedisClient()
    const key = `otp:${email}`

    // Store OTP with metadata
    await client.hSet(key, {
      otp,
      attempts: 0,
      created_at: new Date().toISOString()
    })

    // Set expiry
    await client.expire(key, OTP_EXPIRY_SECONDS)

    logger.info(`OTP stored for ${email}`)
    return otp
  } catch (error) {
    logger.error('Error storing OTP:', error.message)
    throw error
  }
}

/**
 * Verify OTP from Redis
 * @param {string} email - Email address
 * @param {string} otp - OTP to verify
 * @returns {Promise<object>} { isValid: boolean, message: string, remainingAttempts: number }
 */
const verifyOTP = async (email, otp) => {
  try {
    const client = await getRedisClient()
    const key = `otp:${email}`

    // Get OTP data from Redis
    const otpData = await client.hGetAll(key)

    if (!otpData || !otpData.otp) {
      return {
        isValid: false,
        message: 'OTP not found or expired',
        remainingAttempts: 0
      }
    }

    const attempts = parseInt(otpData.attempts, 10)
    const remainingAttempts = MAX_ATTEMPTS - attempts

    // Check max attempts
    if (attempts >= MAX_ATTEMPTS) {
      await client.del(key)
      logger.warn(`Max OTP attempts exceeded for ${email}`)
      return {
        isValid: false,
        message: 'Maximum verification attempts exceeded. Request a new OTP.',
        remainingAttempts: 0
      }
    }

    // Increment attempts
    await client.hSet(key, { attempts: attempts + 1 })

    // Verify OTP
    if (otpData.otp !== otp) {
      logger.warn(`Invalid OTP attempt for ${email}. Attempts: ${attempts + 1}/${MAX_ATTEMPTS}`)
      return {
        isValid: false,
        message: `Invalid OTP. ${remainingAttempts - 1} attempts remaining`,
        remainingAttempts: remainingAttempts - 1
      }
    }

    // OTP is valid, delete it
    await client.del(key)
    logger.info(`OTP verified successfully for ${email}`)

    return {
      isValid: true,
      message: 'OTP verified successfully',
      remainingAttempts: remainingAttempts
    }
  } catch (error) {
    logger.error('Error verifying OTP:', error.message)
    return {
      isValid: false,
      message: 'OTP verification failed',
      remainingAttempts: 0
    }
  }
}

/**
 * Get OTP data from Redis (for debugging)
 * @param {string} email - Email address
 * @returns {Promise<object|null>}
 */
const getOTPData = async (email) => {
  try {
    const client = await getRedisClient()
    const key = `otp:${email}`
    return await client.hGetAll(key)
  } catch (error) {
    logger.error('Error getting OTP data:', error.message)
    return null
  }
}

/**
 * Clear OTP from Redis
 * @param {string} email - Email address
 * @returns {Promise<void>}
 */
const clearOTP = async (email) => {
  try {
    const client = await getRedisClient()
    const key = `otp:${email}`
    await client.del(key)
    logger.info(`OTP cleared for ${email}`)
  } catch (error) {
    logger.error('Error clearing OTP:', error.message)
  }
}

export {
  generateOTP,
  storeOTP,
  verifyOTP,
  getOTPData,
  clearOTP
}
