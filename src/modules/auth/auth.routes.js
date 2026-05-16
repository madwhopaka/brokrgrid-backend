/**
 *
 * @param {object} AuthRouter
 * @param {ExpressRouter} AuthRouter.router
 * @param {AuthController} AuthRouter.AuthController
 * @param {AuthValidator} AuthRouter.AuthValidator
 * @param {makeExpressCallback} AuthRouter.makeExpressCallback
 * @param {makeValidatorCallback} AuthRouter.makeValidatorCallback
 * @returns {ExpressRouter}
 */
export default ({
  router,
  AuthController,
  AuthValidator,
  makeValidatorCallback,
  makeExpressCallback
}) => {
  router.post(
    '/signup',
    makeValidatorCallback(AuthValidator.validateSignup),
    makeExpressCallback(AuthController.signup)
  )

  router.post(
    '/verify-otp',
    makeValidatorCallback(AuthValidator.validateVerifyOtp),
    makeExpressCallback(AuthController.verifyOTP)
  )

  router.post(
    '/resend-otp',
    makeValidatorCallback(AuthValidator.validateResendOtp),
    makeExpressCallback(AuthController.sendOTP)
  )

  router.post(
    '/change-email',
    makeValidatorCallback(AuthValidator.validateChangeEmail),
    makeExpressCallback(AuthController.changeEmail)
  )

  router.post(
    '/login',
    makeValidatorCallback(AuthValidator.validateLogin),
    makeExpressCallback(AuthController.login)
  )

  return router
}
