'use strict';

module.exports = (ValidationSchema, Joi) => {
  return [
    ValidationSchema.define('PaymentTransactionRequestSchema', Joi.object().keys({
      transactionType: Joi.string().valid('payment', 'refund').required(),
      transactionId: Joi.string().max(36).optional(),
      orderBookingId:Joi.string().max(255).optional(),
      merchantTransactionId: Joi.string().max(255).optional(),
      accountId: Joi.string().max(255).optional(),
      amount: Joi.number().optional(),
      currency: Joi.string().max(32).optional(),
      gatewayParams: Joi.object().optional(),
      merchantCallbackUrl: Joi.string().max(255).optional(),
      gatewayId: Joi.number().integer().min(1).required(),
      merchantId: Joi.string().max(255).required(),
      additionalProperties: Joi.object().optional(),
      channel: Joi.string().required(),
      requestedBy: Joi.string().required()
    })),
    ValidationSchema.define('PaymentTransactionFetchSchema', Joi.object().keys({
      merchantId: Joi.string().max(255).required(),
      transactionId: Joi.string().max(36).optional(),
      merchantTransactionId: Joi.string().max(255).optional(),
      gatewayTransactionId: Joi.string().max(255).optional(),
      startDate: Joi.date().format('YYYY-MM-DD').options({convert: true}).optional(),
      endDate: Joi.date().format('YYYY-MM-DD').options({convert: true}).optional(),
      offset: Joi.number().integer().min(0).optional(),
      limit: Joi.number().integer().min(1).optional(),
      appId: Joi.string().max(255).optional()
    }))
  ];
};