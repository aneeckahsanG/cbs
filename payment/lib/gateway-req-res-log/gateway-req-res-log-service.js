'use strict';

const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (db) => {
  return {
    async create(log) {
      return await db['GatewayReqResLog']
        .create(log)
        .then(createdLog => {
          return createdLog.dataValues['id'];
        })
        .catch(err => {
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async update(log) {
        return await db.sequelize.transaction(t => {
            return db['GatewayReqResLog']
                .bulkCreate(log, 
                    {
                        updateOnDuplicate: ["requestData", "responseData", "additionalProperties", "updatedAt"],
                        transaction: t 
                    }
                )
                .then(updatedLog => {
                    if(updatedLog.length !== log.length){
                        throw new AppError(appCodes.GATEWAY_UPDATE_FAILED);
                    }

                    return updatedLog.length;
                })
                .catch(err => {
                    if (err.constructor.name === 'AppError') {
                        throw err;
                      }
          
                    throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
                });
        })
        .then(result => {
            return result;
        })
        .catch(err => {
            throw err;
        })
    },
    async fetch(queryParams) {
      const condition = {};
      if (queryParams.id) {
        condition['id'] = {
          [db.Sequelize.Op.eq]: queryParams.id
        }
      }
      if (queryParams.transactionId) {
        condition['transactionId'] = {
          [db.Sequelize.Op.eq]: queryParams.transactionId
        }
      }

      return await db['GatewayReqResLog']
        .findAll({ where: condition })
        .then(results => {
          return results.map(result => result.dataValues);
        })
        .catch(err => {
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    }
  }
};