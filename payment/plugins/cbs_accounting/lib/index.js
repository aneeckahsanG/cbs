'use strict';

const axios = require('axios');
const uuidv4 = require('uuid').v4;
const vsprintf = require('sprintf-js').vsprintf;

const op = {
  VOID: 0,
  CREATE: 1
};

const status = {
  INITIATED: 'INITIATED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN'
};

module.exports = (gateway) => {
  const useAcctNameAsId = (
      gateway.additionalProperties &&
      gateway.additionalProperties.useAcctNameAsId === "1"
  );

  function toMySQLDate(date) {
    if (!(date instanceof Date)) return null;

    return vsprintf('%d-%02d-%02d %02d:%02d:%02d', [
      date.getFullYear(), (date.getMonth() + 1), date.getDate(),
      date.getHours(), date.getMinutes(), date.getSeconds()
    ]);
  }

  return {
    'payment': async (request) => {
      request.transactionId = request.transactionId || uuidv4();

      if (Number(request.amount) === 0) {
        return {
          op: op.CREATE,
          response: {
            processedAmount: request.amount,
            processedCurrency: request.currency,
            paymentStatus: status.SUCCESS,
          }
        }
      }

      const data = {
        transactionType: 'Payment',
        sourceId: request.transactionId,
        transactionDate: toMySQLDate(new Date()),
        createdBy: request.requestedBy,
        credit: {
          accountId: request.accountId,
          amount: request.amount,
        }
      };
      if (useAcctNameAsId) {
        delete data.credit.accountId;
        data.credit.accountName = request.accountId;
      }

      return await axios({
        url: `${gateway.baseUrl}/api/accounting-transaction`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data
      }).then(response => {
        if (response.data.code !== 0) {
          return {
            op: op.CREATE,
            response: {
              processedAmount: request.amount,
              processedCurrency: request.currency,
              paymentStatus: status.FAILED,
              gatewayErrorCode: response.data.code,
              gatewayErrorMsg: response.data.details
            }
          }
        }

        return {
          op: op.CREATE,
          response: {
            gatewayTransactionId: response.data.id,
            processedAmount: request.amount,
            processedCurrency: request.currency,
            paymentStatus: status.SUCCESS,
          }
        }
      }).catch(err => {
        throw new Error(err.message);
      });
    },
    'paymentCheck': async (paymentInfo) => {
      if (!['merchantTransactionId', 'accountId', 'amount', 'currency'].every(
        field => paymentInfo[field] !== undefined
      )) {
        throw new ReferenceError('[merchantTransactionId, accountId, amount, currency] required');
      }
    },
    'refund': async (request) => {
      request.transactionId = request.transactionId || uuidv4();

      const data = {
        transactionType: 'Payment',
        sourceId: request.transactionId,
        transactionDate: toMySQLDate(new Date()),
        createdBy: request.requestedBy,
        debit: {
          accountId: request.accountId,
          amount: request.amount,
        }
      };
      if (useAcctNameAsId) {
        delete data.debit.accountId;
        data.debit.accountName = request.accountId;
      }

      return await axios({
        url: `${gateway.baseUrl}/api/accounting-transaction`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data
      }).then(response => {
        if (response.data.code !== 0) {
          return {
            op: op.CREATE,
            response: {
              processedAmount: request.amount,
              processedCurrency: request.currency,
              paymentStatus: status.FAILED,
              gatewayErrorCode: response.data.code,
              gatewayErrorMsg: response.data.details
            }
          }
        }

        return {
          op: op.CREATE,
          response: {
            gatewayTransactionId: response.data.id,
            processedAmount: request.amount,
            processedCurrency: request.currency,
            paymentStatus: status.SUCCESS,
          }
        }
      }).catch(err => {
        throw new Error(err.message);
      });
    },
    'refundCheck': async (paymentInfo) => {
      if (!paymentInfo.merchantTransactionId && !paymentInfo.transactionId) {
        throw new ReferenceError('Either merchantTransactionId or transactionId is required');
      }
    },
    'refundMerge': async (paymentRequest, prevPaymentTransaction) => {
      if (!prevPaymentTransaction) {
        throw new ReferenceError('No previous transaction found');
      }

      if (prevPaymentTransaction.paymentStatus !== status.SUCCESS) {
        throw new ReferenceError('Transaction is not successful');
      }

      paymentRequest.accountId = prevPaymentTransaction.accountId;
      paymentRequest.amount = paymentRequest.amount || prevPaymentTransaction.amount;
      paymentRequest.currency = paymentRequest.currency || prevPaymentTransaction.currency;
    },
  };
};
