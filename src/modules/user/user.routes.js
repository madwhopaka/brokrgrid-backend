/**
 * @param {object} UserRouter
 * @param {ExpressRouter} UserRouter.router
 * @param {UserController} UserRouter.UserController
 * @param {makeExpressCallback} UserRouter.makeExpressCallback
 * @returns {ExpressRouter}
 */
export default ({
  router,
  UserController,
  makeExpressCallback
}) => {
  router.get('/', makeExpressCallback(UserController.getUsers))
  return router
}
