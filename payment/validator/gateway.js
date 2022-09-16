'use strict';

module.exports = (ValidationSchema, Joi) => {
  return [
    ValidationSchema.define('GatewayCreateSchema', Joi.object().keys({
      name: Joi.string().max(255).required(),
      prettyName: Joi.string().max(255).required(),
      description: Joi.string().max(1024).optional(),
      baseUrl: Joi.string().max(255).required(),
      additionalProperties: Joi.object().optional(),
      createdBy: Joi.string().max(255).required()
    })),
    ValidationSchema.define('GatewayUpdateSchema', Joi.object().keys({
      id: Joi.number().integer().min(1).required(),
      prettyName: Joi.string().max(255).optional(),
      description: Joi.string().max(1024).optional(),
      status: Joi.number().integer().valid(0, 1).optional(),
      baseUrl: Joi.string().max(255).optional(),
      additionalProperties: Joi.object().optional(),
      updatedBy: Joi.string().max(255).required()
    }).or('prettyName', 'description', 'status', 'baseUrl', 'additionalProperties')),
    ValidationSchema.define('GatewayFetchSchema', Joi.object().keys({
      id: Joi.number().integer().min(1).optional(),
      name: Joi.string().max(255).optional()
    }))
  ];
};