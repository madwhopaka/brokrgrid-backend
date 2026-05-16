import { Op } from 'sequelize'
import PendingSignup from '../../db/models/PendingSignup.js'
import { clearExpiredRateLimitState } from './auth.helpers.js'
import { logger } from '../../support/logger.js'

let cleanupTimer = null

export const cleanupExpiredPendingSignups = async () => {
  const deletedCount = await PendingSignup.destroy({
    where: {
      expires_at: {
        [Op.lt]: new Date()
      }
    }
  })

  clearExpiredRateLimitState()

  return deletedCount
}

export const startPendingSignupCleanupJob = () => {
  if (cleanupTimer) {
    return cleanupTimer
  }

  cleanupTimer = setInterval(async () => {
    try {
      const deletedCount = await cleanupExpiredPendingSignups()
      if (deletedCount > 0) {
        logger.info(`Removed ${deletedCount} expired pending signup record(s).`)
      }
    } catch (error) {
      logger.error('Pending signup cleanup job failed:', error)
    }
  }, 60 * 60 * 1000)

  cleanupTimer.unref?.()
  return cleanupTimer
}

export const stopPendingSignupCleanupJob = () => {
  if (!cleanupTimer) {
    return
  }

  clearInterval(cleanupTimer)
  cleanupTimer = null
}