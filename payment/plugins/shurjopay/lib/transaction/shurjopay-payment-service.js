'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

module.exports = (db) => {
    function buildQueryConditionForPaymentTransaction(queryParams) {
        const whereCondition = {};
        if (queryParams.id) {
          whereCondition['id'] = {
            [db.Sequelize.Op.eq]: queryParams.id
          }
        }
        if (queryParams.merchantId) {
          whereCondition['merchantId'] = {
            [db.Sequelize.Op.eq]: queryParams.merchantId
          }
        }
        if (queryParams.transactionId) {
          whereCondition['transactionId'] = {
            [db.Sequelize.Op.eq]: queryParams.transactionId
          }
        }
        if (queryParams.orderBookingId) {
          whereCondition['orderBookingId'] = {
            [db.Sequelize.Op.eq]: queryParams.orderBookingId
          }
        }
        if (queryParams.merchantTransactionId) {
          whereCondition['merchantTransactionId'] = {
            [db.Sequelize.Op.eq]: queryParams.merchantTransactionId
          }
        }
        if (queryParams.gatewayTransactionId) {
          whereCondition['gatewayTransactionId'] = {
            [db.Sequelize.Op.eq]: queryParams.gatewayTransactionId
          }
        }
        if (queryParams.startDate && queryParams.endDate) {
          whereCondition[db.Sequelize.Op.and] = [{
            createdAt: {
              [db.Sequelize.Op.gte]: queryParams.startDate
            }
          }, {
            createdAt: {
              [db.Sequelize.Op.lte]: queryParams.endDate
            }
          }];
        } else if (queryParams.startDate) {
          whereCondition['createdAt'] = {
            [db.Sequelize.Op.gte]: queryParams.startDate
          }
        } else if (queryParams.endDate) {
          whereCondition['createdAt'] = {
            [db.Sequelize.Op.lte]: queryParams.endDate
          }
        }
    
        return whereCondition;
    }

    function buildQueryConditionForGateway(queryParams) {
        const whereCondition = {};
        if (queryParams.id) {
          whereCondition['id'] = {
            [db.Sequelize.Op.eq]: queryParams.id
          }
        }

        return whereCondition;
    }

    function buildQueryConditionForMerchant(queryParams) {
      const whereCondition = {};
      if (queryParams.id) {
        whereCondition['id'] = {
          [db.Sequelize.Op.eq]: queryParams.id
        }
      }

      if (queryParams.merchantId) {
        whereCondition['merchantId'] = {
          [db.Sequelize.Op.eq]: queryParams.merchantId
        }
      }

      if (queryParams.gatewayId) {
        whereCondition['gatewayId'] = {
          [db.Sequelize.Op.eq]: queryParams.gatewayId
        }
      }

      return whereCondition;
  }
    
    return {
        async fetchPaymentInfo(queryParams) {
            queryParams.offset && (queryParams.offset = Number(queryParams.offset));
            queryParams.limit && (queryParams.limit = Number(queryParams.limit));
      
            return await db['PaymentTransaction']
              .findAll({
                offset: queryParams.offset,
                limit: queryParams.limit,
                where: buildQueryConditionForPaymentTransaction(queryParams)
              })
              .then(paymentTransactions => {
                return paymentTransactions;
              })
              .catch(err => {
                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
              });
        },
        async fetchGatewayInfo(queryParams) {
            queryParams.offset && (queryParams.offset = Number(queryParams.offset));
            queryParams.limit && (queryParams.limit = Number(queryParams.limit));
      
            return await db['Gateway']
              .findAll({
                offset: queryParams.offset,
                limit: queryParams.limit,
                where: buildQueryConditionForGateway(queryParams)
              })
              .then(gateways => {
                return gateways;
              })
              .catch(err => {
                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
              })
        },
        async updatePaymentTransaction(transaction) {
          return await db['PaymentTransaction']
            .update(transaction, {
              where: {
                id: {
                  [db.Sequelize.Op.eq]: transaction.id
                }
              }
            })
            .then(([affectedRows]) => {
              if (affectedRows <= 0) {
                throw new AppError(appCodes.PAYMENT_TRANSACTION_UPDATE_FAILED);
              }
    
              return affectedRows;
            })
            .catch(err => {
              if (err.constructor.name === 'AppError') {
                throw err;
              }
                  
              throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            });
        },
        async fetchMerchantInfo(queryParams) {
          queryParams.offset && (queryParams.offset = Number(queryParams.offset));
          queryParams.limit && (queryParams.limit = Number(queryParams.limit));

          return await db['MerchantGateway']
            .findAll({
              offset: queryParams.offset,
              limit: queryParams.limit,
              where: buildQueryConditionForMerchant(queryParams)
            })
            .then(paymentTransactions => {
              return paymentTransactions;
            })
            .catch(err => {
              throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            });
      },
        async updatePayment(context) {
        return await db['PaymentTransaction']
        .update(context, {
          where: {
            id: {
              [db.Sequelize.Op.eq]: context.id
            }
          }
        })
        .then(([affectedRows]) => {
          if (affectedRows <= 0) {
            throw new AppError(appCodes.PAYMENT_TRANSACTION_UPDATE_FAILED);
          }

          return affectedRows;
        })
        .catch(err => {
          console.log(err);
          if (err.constructor.name === 'AppError') {
            throw err;
          }

          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
      },
        async fetchPaidPaymentByOrder(queryParams) {
        const whereCondition = {};
        if (queryParams.orderBookingId) {
          whereCondition['orderBookingId'] = {
            [db.Sequelize.Op.eq]: queryParams.orderBookingId
          }
        }
        if (queryParams.merchantId) {
          whereCondition['merchantId'] = {
            [db.Sequelize.Op.eq]: queryParams.merchantId
          }
        }
        whereCondition['gatewayTransactionId'] = {
          [db.Sequelize.Op.ne]: null
        }
        return await db['PaymentTransaction']
          .findAll({
            where: whereCondition
          })
          .then(paymentTransactions => {
            return paymentTransactions;
          })
          .catch(err => {
            throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
          });
      }
    }
}