'use strict';

module.exports = (gatewayPaymentConfig) => {
  const express = require('express');
  const router = express.Router();

  const vs = require('../validator');
  const validationHandler = require('../middlewares/validation-handler');

  const responseHandler = require('../utils/response-handler');

  router
    .get('/gateway/payment-transaction-config', async function (req, res) {
        try {
          res.data = await gatewayPaymentConfig.fetchGatewayPaymentConfig(req.query);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .post('/gateway/payment-transaction-config', validationHandler(vs['GatewayPaymentConfigCreateSchema']),
      async function (req, res) {
        try {
          res.data = await gatewayPaymentConfig.createGatewayPaymentConfig(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .put('/gateway/payment-transaction-config', validationHandler(vs['GatewayPaymentConfigUpdateSchema']),
      async function (req, res) {
        try {
          res.data = await gatewayPaymentConfig.updateGatewayPaymentConfig(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      });

  return router;
};
