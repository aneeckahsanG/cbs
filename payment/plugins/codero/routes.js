'use strict';

module.exports = async (context) => {
    const express = require('express');
    const router = express.Router();

    const db = context['db'];

    const transaction = await require('./lib/transaction')({db:db});
    const responseHandler = require('../../utils/response-handler');

    router
        .get('/:paymentId',
            async function (req, res) {
                try {
                    const data = await transaction.index(req.params.paymentId);
                    res.redirect(data);
                } catch (e) {
                    responseHandler(e, req, res);
                }
                
            }
        )
        .post('/success',
            async function (req, res) {
                try {
                    const data = await transaction.success(req.body);
                    res.redirect(data);
                } catch (e) {
                    responseHandler(e, req, res);
                }
            }
        )
        .post('/fail',
            async function (req, res) {
                try {
                    const data = await transaction.fail(req.body);
                    res.redirect(data);
                } catch (e) {
                    console.log(e);
                    responseHandler(e, req, res);
                }
            }
        )
        .post('/cancel',
            async function (req, res) {
                try {
                    const data = await transaction.cancel(req.body);
                    res.redirect(data);
                } catch (e) {
                    responseHandler(e, req, res);
                }
            }
        );

    return router;
}