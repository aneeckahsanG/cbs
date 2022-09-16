'use strict';

module.exports = (paymentTransactionController) => {
  const express = require("express");
  const router = express.Router();
  const responseHandler = require('../utils/response-handler');

  const vs = require('../validator');
  const validationHandler = require('../middlewares/validation-handler');

  const log = require('../lib/log');
  
  router
    .get('/payment-transaction',
      function (req, res, next) {
        req.body = req.query;
        next();
      },
      validationHandler(vs['PaymentTransactionFetchSchema']),
      async (req, res) => {
        try {
          res.data = await paymentTransactionController.fetchPaymentTransactions(req.query);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .post('/payment-transaction',
      validationHandler(vs['PaymentTransactionRequestSchema']),
      async (req, res) => {
        try {
          log.debug.debug('Post Transaction Request\n' + JSON.stringify(req.body));

          res.data = await paymentTransactionController.createPaymentTransaction(req.body);

          log.debug.debug('Post Transaction Response\n' + JSON.stringify(res.data));
          responseHandler(null, req, res);
        } catch (e) {
          
          log.error.error(e);
          responseHandler(e, req, res);
        }
      });

  return router
};