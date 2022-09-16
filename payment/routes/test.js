'use strict';

module.exports = () => {
  const express = require('express');
  const router = express.Router();

  const uuidv4 = require('uuid').v4;

  const vs = require('../validator');
  const validationHandler = require('../middlewares/validation-handler');

  const responseHandler = require('../utils/response-handler');

  let retryCounter = 0;
  const response = {
    0: () => { return {status: 500, resend: false}},
    1: () => { return {status: 500, resend: true}},
    2: () => { return {status: 200}},
    3: () => { return {status: 500}},
    4: () => { return {status: 500}},
  };
  router
    .post('/oauth/token', async function (req, res) {
      console.log(req.body);
      res.json({
        expires_in: 600,
        access_token: uuidv4(),
        refresh_token: uuidv4()
      });
    })
    .post('/api/v2.0/charge', async function (req, res) {
      console.log(req.headers['authorization']);
      console.log(req.body);
      res.json({
        url: 'http://localhost/redirect/to/something',
        spTransID: uuidv4(),
        errorCode: '00',
        errorMessage: null
      });
    })
    .post('/merchant/callback', async function (req, res) {
      res.json(response[retryCounter++]());
    });

  return router;
};
