/**
 * @param {object} UserRouter
 * @param {ExpressRouter} UserRouter.router
 * @param {UserController} UserRouter.UserController
 * @param {makeExpressCallback} UserRouter.makeExpressCallback
 * @param {protectedRoute} UserRouter.protectedRoute
 * @returns {ExpressRouter}
 */
export default ({
  router,
  UserController,
  makeExpressCallback,
  protectedRoute
}) => {
  router.get('/', protectedRoute(makeExpressCallback(UserController.getUsers)))
  router.get('/:userId', makeExpressCallback(UserController.getUser))
  router.put('/:userId', protectedRoute(makeExpressCallback(UserController.updateUser)))
  return router
}
