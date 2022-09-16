'use strict';

module.exports = (merchantGateway) => {
  const express = require('express');
  const router = express.Router();

  const vs = require('../validator');
  const validationHandler = require('../middlewares/validation-handler');

  const responseHandler = require('../utils/response-handler');

  router
    .get('/merchant-gateway',
      function (req, res, next) {
        req.body = req.query;
        next();
      }, validationHandler(vs['MerchantGatewayFetchSchema']),
      async function (req, res) {
        try {
          res.data = await merchantGateway.fetchMerchantGateway(req.query);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .post('/merchant-gateway', validationHandler(vs['MerchantGatewayCreateSchema']),
      async function (req, res) {
        try {
          res.data = await merchantGateway.createMerchantGateway(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .put('/merchant-gateway', validationHandler(vs['MerchantGatewayUpdateSchema']),
      async function (req, res) {
        try {
          res.data = await merchantGateway.updateMerchantGateway(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      });

  return router;
};
