// Routes
import config from 'config'
import { AuthRoutes } from '../modules/auth/auth.module.js'
import { AppHealthRoutes } from '../modules/app-health/app-health.module.js'
import { UserRoutes } from '../modules/user/user.module.js'

const routes = [
  {
    path: '/auth',
    route: AuthRoutes
  },
  {
    path: '/users',
    route: UserRoutes
  },
  {
    excludeAPIPrefix: true,
    path: '/health',
    route: AppHealthRoutes
  }

]

/**
 * Register routes with the app
 * @param {object} app - The Express app object
 */

const registerRoutes = (app) => {
  routes.forEach(({ path, route, excludeAPIPrefix }) => {
    const normalizedPrefix = String(config.API_PREFIX || '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
    const apiPrefix = normalizedPrefix ? `/${normalizedPrefix}` : ''
    // If excludeAPIPrefix is true, use the path as is.
    const routePath = excludeAPIPrefix ? path : apiPrefix + path
    // Mount the route on the app using the determined route path.
    app.use(routePath, route)
  })
}

export default registerRoutes
