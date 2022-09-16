'use strict';

const {TRX_STATUS} = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (db) => {
  function buildQueryCondition(queryParams) {
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

  return {
    async create(paymentTransaction) {
      const record = {};
      Object.assign(record, paymentTransaction.request);
      Object.assign(record, paymentTransaction.response);

      record.createdBy = record.requestedBy;
      record.createdAt = new Date();
      delete record.id;
      delete record.requestedBy;

      return await db['PaymentTransaction']
        .create(record)
        .then((createdRecord) => {
          record.id = createdRecord.dataValues.id;
          return record;
        })
        .catch(err => {
          console.log('db err', err);
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async update(paymentTransaction) {
      const updateData = paymentTransaction.response;
      await db['PaymentTransaction']
        .update(updateData, {
          where: {
            id: {
              [db.Sequelize.Op.eq]: updateData.id
            },
            paymentStatus: {
              [db.Sequelize.Op.notIn]: [TRX_STATUS.SUCCESS, TRX_STATUS.FAILED]
            }
          }
        }).then(([affectedRows]) => {
          if (affectedRows <= 0) throw new AppError(appCodes.PAYMENT_TRANSACTION_UPDATE_FAILED);
        }).catch(err => {
          if (err.constructor.name === 'AppError') {
            throw err;
          }

          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async updatePaymentTransactionForSync(paymentTransaction) {
      return await db['PaymentTransaction']
        .update(paymentTransaction, {
          where: {
            id: {
              [db.Sequelize.Op.eq]: paymentTransaction.id
            },
            paymentStatus: {
              [db.Sequelize.Op.notIn]: [TRX_STATUS.SUCCESS, TRX_STATUS.FAILED]
            }
          }
        }).then(([affectedRows]) => {
          return affectedRows;
        }).catch(err => {
          if (err.constructor.name === 'AppError') {
            throw err;
          }

          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async fetchTransaction(context) {
      if (!['transactionId', 'merchantTransactionId', 'gatewayTransactionId']
        .some((elem) => context[elem])) {
        return null;
      }

      const condition = {};
      if (context.transactionId) {
        condition['transactionId'] = {
          [db.Sequelize.Op.eq]: context.transactionId
        }
      }
      if (context.merchantTransactionId) {
        condition['merchantTransactionId'] = {
          [db.Sequelize.Op.eq]: context.merchantTransactionId
        }
      }
      if (context.gatewayTransactionId) {
        condition['gatewayTransactionId'] = {
          [db.Sequelize.Op.eq]: context.gatewayTransactionId
        }
      }
      if (!context.ignoreStatus) {
        condition['paymentStatus'] = {
          [db.Sequelize.Op.notIn]: [TRX_STATUS.SUCCESS, TRX_STATUS.FAILED]
        };
      }

      return await db['PaymentTransaction']
        .findAll({
          where: condition,
          order: [
            ['createdAt', 'DESC']
          ],
          limit: 1
        }).then((transactions) => {
          if (transactions.length === 0) return null;

          return transactions[0].dataValues;
        }).catch(err => {
          if (err.constructor.name === 'AppError') {
            throw err;
          }

          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async fetch(queryParams) {
      queryParams.offset && (queryParams.offset = Number(queryParams.offset));
      queryParams.limit && (queryParams.limit = Number(queryParams.limit));

      return await db['PaymentTransaction']
        .findAll({
          offset: queryParams.offset,
          limit: queryParams.limit,
          where: buildQueryCondition(queryParams),
          attributes: {
            exclude: [ 'id' ]
          }
        })
        .then(paymentTransactions => {
          return paymentTransactions;
        })
        .catch(err => {
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    }
  }
};