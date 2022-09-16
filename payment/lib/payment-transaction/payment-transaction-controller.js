'use strict';

const uuidv4 = require('uuid').v4;

const {ACTIVE, TRX_RECORD_OP, TRX_STATUS, EVENT_TYPE} = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (
  paymentTransactionService, merchantGatewayService, gatewayService, eventPublisher, pluginManager, config
) => {

  function findInterval(gateway, defaultCheckIntervals) {
    if (gateway.additionalProperties && gateway.additionalProperties.checkIntervals) {
      return Array.isArray(gateway.additionalProperties.checkIntervals) ?
        gateway.additionalProperties.checkIntervals[0] :
        gateway.additionalProperties.checkIntervals;
    }

    return defaultCheckIntervals[0];
  }

  return {
    async createPaymentTransaction(payment) {
      try {

        const detailsList = await merchantGatewayService.fetchMerchantGatewayDetails({
          merchantId: payment.merchantId,
          gatewayId: payment.gatewayId
        });

          console.log("Request start:"+JSON.stringify(detailsList));
          // console.log("Request length:"+detailsList.length);
        if (detailsList.length === 0) throw new AppError(appCodes.INVALID_MERCHANT_OR_GATEWAY_ID);

        const details = detailsList[0];

        const plugin = await pluginManager.getOrLoad(details.gateway.name);

        const type = payment.transactionType;
        const typeCheck = `${payment.transactionType}Check`;
        const typeMerge = `${payment.transactionType}Merge`;

        if (!plugin[type]) throw new AppError(appCodes.TRANSACTION_TYPE_NOT_SUPPORTED);
        payment['storeMerchantCallback'] = details.callbackUrl;

        if (plugin[typeCheck]) await plugin[typeCheck](payment);
        if (plugin[typeMerge]) {
          const searchContext = {
            transactionId: payment.transactionId,
            merchantTransactionId: payment.merchantTransactionId,
            ignoreStatus: true
          };
          const prevPaymentTransaction = await paymentTransactionService.fetchTransaction(searchContext);
          await plugin[typeMerge](payment, prevPaymentTransaction);
        }

        payment.transactionId = payment.transactionId || uuidv4();
        
        const pluginResp = await plugin[type](payment);
        pluginResp.request = payment;
        const createdPaymentTransaction = await paymentTransactionService.create(pluginResp);

        if (pluginResp.op === TRX_RECORD_OP.VOID) return pluginResp.response;

        if (createdPaymentTransaction.paymentStatus !== TRX_STATUS.SUCCESS &&
          createdPaymentTransaction.paymentStatus !== TRX_STATUS.FAILED) {
          let interval = findInterval(details.gateway, config.syncHandler.checkIntervals);
          const processingAt = new Date();
          processingAt.setSeconds(processingAt.getSeconds() + interval);

          await eventPublisher.publish({
            eventType: EVENT_TYPE.SYNC_STATUS,
            eventData: createdPaymentTransaction,
            processingAt: processingAt
          });
        }

        delete createdPaymentTransaction.id;
        return createdPaymentTransaction;
      } catch (e) {
        
        if (e instanceof ReferenceError) {
          throw new AppError(appCodes.MALFORMED_OR_INSUFFICIENT_PAYMENT_INFO);
        }

        throw e;
      }
    },
    async updatePaymentTransaction(request) {
      if (!request.headers['gateway-id']) throw new AppError(appCodes.PAYMENT_GATEWAY_ID_REQUIRED);

      const gatewayId = request.headers['gateway-id'];
      try {
        const gateways = await gatewayService.fetchGateway({id: gatewayId, status: ACTIVE});
        if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

        const gateway = gateways[0];

        const plugin = await pluginManager.getOrLoad(gateway.name);

        if (!plugin['parseNotification'] || !plugin['replyNotification']) {
          throw new AppError(appCodes.OPERATION_NOT_SUPPORTED);
        }
        const pluginResp = await plugin['parseNotification'](request);
        try {
          const prevPaymentTransaction = await paymentTransactionService.fetchTransaction(pluginResp.response);
          if (!prevPaymentTransaction) throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);

          Object.assign(pluginResp.response, {id: prevPaymentTransaction.id});
          prevPaymentTransaction.gatewayParams = prevPaymentTransaction.gatewayParams || {};
          pluginResp.response.gatewayParams =
            Object.assign(prevPaymentTransaction.gatewayParams, pluginResp.response.gatewayParams);

          await paymentTransactionService.update(pluginResp);

          const merchantGateways = await merchantGatewayService.fetchMerchantGateway({
            merchantId: prevPaymentTransaction.merchantId,
            gatewayId: prevPaymentTransaction.gatewayId,
            status: ACTIVE
          });
          if (merchantGateways.length >= 1 &&
            (prevPaymentTransaction.merchantCallbackUrl || merchantGateways[0].callbackUrl)) {
            prevPaymentTransaction.merchantCallbackUrl =
              prevPaymentTransaction.merchantCallbackUrl || merchantGateways[0].callbackUrl;
            Object.assign(prevPaymentTransaction, pluginResp.response);
            await eventPublisher.publish({
              eventType: EVENT_TYPE.NOTIFY,
              eventData: prevPaymentTransaction
            });
          }

          return await plugin['replyNotification'](appCodes.SUCCESS);
        } catch (e) {
          if (e.constructor.name !== 'AppError') e = appCodes.INTERNAL_SERVER_ERROR;

          e = {httpCode: e.httpCode, code: e.code, title: e.name || e.title, details: e.description || e.details};
          return await plugin['replyNotification'](e);
        }
      } catch (e) {
        if (e.constructor.name !== 'AppError') e = appCodes.INTERNAL_SERVER_ERROR;

        return {
          headers: {'Content-Type': 'application/json'},
          status: 200,
          body: JSON.stringify({httpCode: e.httpCode, code: e.code, title: e.name || e.title, details: e.description || e.details})
        };
      }
    },
    async updatePaymentTransactionForSync(paymentTransaction) {
      try {
        return await paymentTransactionService.updatePaymentTransactionForSync(paymentTransaction);
      } catch (e) {
        throw e;
      }
    },
    async fetchPaymentTransactions(queryParams) {
      try {
        return await paymentTransactionService.fetch(queryParams);
      } catch (e) {
        throw e;
      }
    }
  }
};
