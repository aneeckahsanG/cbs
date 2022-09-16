'use strict';

module.exports = (ValidationSchema, Joi) => {
  return [
    ValidationSchema.define('GatewayPaymentConfigCreateSchema', Joi.object().keys({
      gatewayId: Joi.number().integer().min(1).required(),
      configs:Joi.object().required(),
      createdBy: Joi.string().max(255).required()
    })),
    ValidationSchema.define('GatewayPaymentConfigUpdateSchema', Joi.object().keys({
      gatewayId: Joi.number().integer().min(1).required(),
      id: Joi.number().integer().min(1).optional(),
      configs:Joi.object().required(),
      updatedBy: Joi.string().max(255).required()
    }))
  ];
};