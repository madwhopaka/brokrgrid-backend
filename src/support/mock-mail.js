/**
 * Mock Email Service for Development
 * Logs emails to console instead of sending them
 * Use this for testing without SMTP credentials
 */
import { logger } from './logger.js'

const mockMailService = {
  /**
   * Send OTP email (mock - just logs to console)
   * @param {string} email - Recipient email
   * @param {string} otp - One-time password
   * @returns {Promise<object>}
   */
  sendOTPEmail: async (email, otp) => {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info('📧 MOCK EMAIL SERVICE (Development)')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info(`To: ${email}`)
      logger.info(`Subject: Email Verification - OTP`)
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info(`Your OTP: ${otp}`)
      logger.info('This OTP will expire in 10 minutes.')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return {
        success: true,
        messageId: `mock-${Date.now()}`
      }
    } catch (error) {
      logger.error('Error in mock email service:', error)
      throw error
    }
  },

  /**
   * Send verification confirmation email (mock)
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @returns {Promise<object>}
   */
  sendVerificationConfirmation: async (email, name) => {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info('📧 MOCK EMAIL SERVICE (Development)')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info(`To: ${email}`)
      logger.info(`Subject: Email Verified - Welcome to BrokerGrid`)
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info(`Hello ${name || 'User'},`)
      logger.info('Your email address has been verified successfully.')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return {
        success: true,
        messageId: `mock-${Date.now()}`
      }
    } catch (error) {
      logger.error('Error in mock email service:', error)
      throw error
    }
  }
}

export default mockMailService
