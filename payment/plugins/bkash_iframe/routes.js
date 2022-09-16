'use strict';

module.exports = async (context) => {
    const express = require('express');
    const router = express.Router();

    const db = context['db']; 
    const cache = context['cache'];

    const transaction = await require('./lib/transaction')({db:db, cache:cache});
    const responseHandler = require('../../utils/response-handler');

    const log = require('../../lib/log');

    const appCodes = require('../../lib/app-codes');
    const AppError = require('../../lib/app-error').AppError;

    router
        .get('/:paymentId',
            async function (req, res) {
                try {
                    const data = await transaction.index(req.params.paymentId);

                    log.debug.debug('bKash Index Page Info\n' + JSON.stringify(data));
                    res.render('bkash', data);
                } catch (e) {
                    log.error.error(e);
                    responseHandler(e, req, res);
                }
                
            }
        )
        .post('/create',
            function (req, res, next) {
                try {
                    if (transaction.validateAccessKey(req.body.paymentId,req.headers['access-key'])) {
                        next();
                    } else {
                        throw new AppError(appCodes.TEMPERED_PAYMENT);
                    }
                } catch (e) {
                    responseHandler(e, req, res);
                }  
            },
            async function (req, res) {
                try {
                    res.data = await transaction.create(req.body.paymentId);
                    responseHandler(null, req, res);
                } catch (e) {
                    responseHandler(e, req, res);
                }
            }
        )
        .post('/execute',
            function (req, res, next) {
                try {
                    if (transaction.validateAccessKey(req.body.paymentId,req.headers['access-key'])) {
                        next();
                    } else {
                        throw new AppError(appCodes.TEMPERED_PAYMENT);
                    }
                } catch (e) {
                    responseHandler(e, req, res);
                }  
            },
            async function (req, res) {
                try {
                    res.data = await transaction.execute(req.body.paymentId);
                    responseHandler(null, req, res);
                } catch (e) {
                    responseHandler(e, req, res);
                }
            }
        )
        .post('/cancel',
            function (req, res, next) {
                try {
                    if (transaction.validateAccessKey(req.body.paymentId,req.headers['access-key'])) {
                        next();
                    } else {
                        throw new AppError(appCodes.TEMPERED_PAYMENT);
                    }
                } catch (e) {
                    responseHandler(e, req, res);
                }  
            },
            async function (req, res) {
                try {
                    res.data = await transaction.cancel(req.body.paymentId);
                    responseHandler(null, req, res);
                } catch (e) {
                    responseHandler(e, req, res);
                }
            }
        );

    return router;
}