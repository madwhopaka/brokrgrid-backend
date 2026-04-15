import Joi from 'joi'

const options = {
  errors: {
    wrap: {
      label: ''
    }
  }
}

export default {
  /**
   * Validates a signup request with user and organization data.
   * @param {object} httpRequest - The HTTP request object.
   * @param {object} httpRequest.body - The request body.
   * @returns {object} - The validation result.
   */
  validateSignup: (httpRequest) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().min(3).max(50).required(),
      phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
          'string.pattern.base': 'Phone must be a valid 10-digit number starting with 6-9'
        }),
      password: Joi.string().min(8).max(20).required(),
      organization_name: Joi.string().min(3).max(255).required(),
      organization_slug: Joi.string().min(3).max(255).required(),
      address: Joi.string(),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      organization_phone: Joi.string().max(20)
    })
    return schema.validate(httpRequest.body, options)
  },

  /**
   * Validates a login request.
   * @param {object} httpRequest - The HTTP request object.
   * @param {object} httpRequest.body - The request body.
   * @param {string} [httpRequest.body.phone] - The phone number to validate.
   * @param {string} [httpRequest.body.email] - The email to validate.
   * @param {string} httpRequest.body.password - The password to validate.
   * @returns {object} - The validation result.
   */
  validateLogin: (httpRequest) => {
    const schema = Joi.object({
      phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Provide valid phone number!'
        }),
      email: Joi.string().email().optional(),
      password: Joi.string().min(8).max(20).required()
    }).or('phone', 'email')

    return schema.validate(httpRequest.body, options)
  }
}
