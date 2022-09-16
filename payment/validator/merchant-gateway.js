'use strict';

module.exports = (ValidationSchema, Joi) => {
  return [
    ValidationSchema.define('MerchantGatewayCreateSchema', Joi.object().keys({
      merchantId: Joi.string().max(255).required(),
      gatewayId: Joi.number().integer().min(1).required(),
      additionalProperties: Joi.object().optional(),
      callbackUrl: Joi.string().max(255).optional(),
      createdBy: Joi.string().max(255).required()
    })),
    ValidationSchema.define('MerchantGatewayUpdateSchema', Joi.object().keys({
      id: Joi.number().integer().min(1).required(),
      merchantId: Joi.string().max(255).optional(),
      gatewayId: Joi.number().integer().min(1).optional(),
      additionalProperties: Joi.object().optional(),
      status: Joi.number().integer().valid(0, 1).optional(),
      callbackUrl: Joi.string().max(255).optional(),
      updatedBy: Joi.string().max(255).required()
    }).or('merchantId', 'gatewayId', 'status', 'callbackUrl')),
    ValidationSchema.define('MerchantGatewayFetchSchema', Joi.object().keys({
      id: Joi.number().integer().min(1).optional(),
      merchantId: Joi.string().max(255).optional()
    }))
  ];
};