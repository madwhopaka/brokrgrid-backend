import { auth } from './index.js'
import { UnauthorizedError } from '../utils/api-errors.js'

/**
 * Wrapper to protect specific routes with authentication only
 * Use this to wrap route handlers that require authentication
 *
 * @param {Function} handler - The route handler function
 * @returns {Function} - Express middleware that applies auth check
 *
 * @example
 * router.get('/:userId', protectedRoute((req, res, next) => {
 *   // Your handler code
 * }))
 */
const protectedRoute = (handler) => {
  return async (req, res, next) => {
    try {
      // Apply auth middleware
      await auth(req, res, () => {
        // If auth passes, call the handler
        handler(req, res, next)
      })
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Wrapper to protect specific routes with both authentication AND authorization
 * Use this to wrap route handlers that require specific roles
 *
 * @param {Array<string>} allowedRoles - Array of roles that are allowed (e.g., ['admin', 'manager'])
 * @param {Function} handler - The route handler function
 * @returns {Function} - Express middleware that applies auth + role check
 *
 * @example
 * router.delete('/:userId', protectedRouteWithRole(['admin'], (req, res, next) => {
 *   // Only admin can delete
 * }))
 *
 * @example
 * router.put('/:userId', protectedRouteWithRole(['admin', 'manager'], (req, res, next) => {
 *   // Admin and manager can update
 * }))
 */
const protectedRouteWithRole = (allowedRoles, handler) => {
  return async (req, res, next) => {
    try {
      // Apply auth middleware first
      await auth(req, res, async () => {
        // Check if user has required role
        if (!req.context?.role || !allowedRoles.includes(req.context.role)) {
          throw new UnauthorizedError(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
        }
        // If auth and role passes, call the handler
        handler(req, res, next)
      })
    } catch (error) {
      next(error)
    }
  }
}

export { protectedRoute as default, protectedRouteWithRole }
