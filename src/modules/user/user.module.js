import { Router } from 'express'
import { makeExpressCallback } from '../../middlewares/index.js'
import UserService from './user.service.js'
import UserController from './user.controller.js'
import createRoutes from './user.routes.js'

/**
 * Initializes the router and sets up the routes for the user module.
 */
const router = Router()

/**
 * Sets up the routes for the user module.
 * @param {Object} dependencies - The dependencies required for setting up the routes.
 * @param {Router} dependencies.router - The Express router.
 * @param {Object} dependencies.UserController - The user controller.
 * @param {Function} dependencies.makeExpressCallback - Middleware for handling Express callbacks.
 * @returns {Router} - The configured router.
 */
const routes = createRoutes({
	router,
	UserController,
	makeExpressCallback
})

export {
	UserController,
	UserService,
	routes as UserRoutes
}
