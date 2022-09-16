'use strict';

const constants = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (db) => {
  return {
    async create(merchantGateway) {
      return await db['MerchantGateway']
        .create(merchantGateway)
        .then(createdMerchantGateway => {
          return createdMerchantGateway.dataValues['id'];
        })
        .catch(err => {
          if (err instanceof db.Sequelize.UniqueConstraintError) {
            throw new AppError(appCodes.MERCHANT_ID_GATEWAY_ID_NEED_TO_BE_UNIQUE);
          }
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async update(merchantGateway) {
      return await db['MerchantGateway']
        .update(merchantGateway, {
          where: {
            id: {
              [db.Sequelize.Op.eq]: merchantGateway.id
            }
          }
        })
        .then(([affectedRows]) => {
          if (affectedRows <= 0) {
            throw new AppError(appCodes.MERCHANT_GATEWAY_UPDATE_FAILED);
          }

          return affectedRows;
        })
        .catch(err => {
          if (err.constructor.name === 'AppError') {
            throw err;
          }

          if (err instanceof db.Sequelize.UniqueConstraintError) {
            throw new AppError(appCodes.MERCHANT_ID_GATEWAY_ID_NEED_TO_BE_UNIQUE);
          }

          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async fetch(queryParams) {
      const condition = {};
      if (queryParams.id) {
        condition['id'] = {
          [db.Sequelize.Op.eq]: queryParams.id
        }
      }
      if (queryParams.merchantId) {
        condition['merchantId'] = {
          [db.Sequelize.Op.eq]: queryParams.merchantId
        }
      }
      if (queryParams.status !== undefined) {
        condition['status'] = {
          [db.Sequelize.Op.eq]: queryParams.status
        }
      }

      return await db['MerchantGateway']
        .findAll({ where: condition })
        .then(results => {
          return results.map(result => result.dataValues);
        })
        .catch(err => {
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async fetchMerchantGatewayDetails({merchantId, gatewayId}) {
      return await db['MerchantGateway']
        .findAll({
          where: {
            merchantId: {
              [db.Sequelize.Op.eq]: merchantId,
            },
            gatewayId: {
              [db.Sequelize.Op.eq]: gatewayId
            },
            status: {
              [db.Sequelize.Op.eq]: constants.ACTIVE
            }
          },
          include: [
            {
              model: db['Gateway'],
              required: true,
              where: {
                status: {
                  [db.Sequelize.Op.eq]: constants.ACTIVE
                }
              }
            }
          ]
        })
        .then(results => {
          return results.map(result => {
            result.dataValues.gateway = result.dataValues.Gateway.dataValues;
            delete result.dataValues.Gateway;
            return result.dataValues;
          });
        })
        .catch(err => {
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    }
  }
};