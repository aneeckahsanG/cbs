'use strict';

module.exports = (gateway) => {
  const express = require('express');
  const router = express.Router();

  const vs = require('../validator');
  const validationHandler = require('../middlewares/validation-handler');

  const responseHandler = require('../utils/response-handler');

  router
    .get('/gateway',
      function (req, res, next) {
        req.body = req.query;
        next();
      }, validationHandler(vs['GatewayFetchSchema']),
      async function (req, res) {
        try {
          res.data = await gateway.fetchGateway(req.query);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .post('/gateway', validationHandler(vs['GatewayCreateSchema']),
      async function (req, res) {
        try {
          res.data = await gateway.createGateway(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      })
    .put('/gateway', validationHandler(vs['GatewayUpdateSchema']),
      async function (req, res) {
        try {
          res.data = await gateway.updateGateway(req.body);
          responseHandler(null, req, res);
        } catch (e) {
          responseHandler(e, req, res);
        }
      });

  return router;
};
