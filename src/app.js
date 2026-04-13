import express from 'express'
import cors from 'cors'
import { logger, requestLogger } from './support/logger.js'
import { errorHandler, badJsonHandler, notFoundHandler, auth } from './middlewares/index.js'
import loadRoutes from './loaders/routes.js'
import './loaders/config.js'
import helmet from 'helmet'
import csurf from 'csurf'

const app = express()

/**
 * Set up security headers.
 */
app.use(helmet())

/**
 * Enable CORS
 */
app.use(cors())

/**
 * Set up CSRF protection (disabled for API routes, enabled for form routes).
 */
// app.use(csurf()) // Disabled for API - will be configured per route if needed

/**
 * Parse JSON body
 */
app.use(express.json())

/**
 * Handle bad JSON format
 */
app.use(badJsonHandler)

/**
 * Log requests
 */
app.use(requestLogger)

/**
 * Authentication middleware - protect all routes
 */
app.use(auth)

/**
 * Load routes
 */
loadRoutes(app)

app.get('/', (req, res) => {
  logger.info('Welcome to the BrokrGrid Backend')
  res.json({ message: 'Welcome to the BrokrGrid Backend' })
})

/**
 * Handle 404 not found error
 */
app.use(notFoundHandler)

/**
 * Catch all errors
 */
app.use(errorHandler)

export default app
