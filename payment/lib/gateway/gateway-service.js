'use strict';

const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (db) => {
  return {
    async create(gateway) {
      return await db['Gateway']
        .create(gateway)
        .then(createdGateway => {
          return createdGateway.dataValues['id'];
        })
        .catch(err => {
          if (err instanceof db.Sequelize.UniqueConstraintError) {
            throw new AppError(appCodes.DUPLICATE_GATEWAY_NAME);
          }
          throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
        });
    },
    async update(gateway) {
      return await db.sequelize.transaction(t => {
        return db['Gateway']
          .update(gateway, {
            where: {
              id: {
                [db.Sequelize.Op.eq]: gateway.id
              }
            },
            transaction: t
          })
          .then(async ([affectedRows]) => {
            if (affectedRows <= 0) {
              throw new AppError(appCodes.GATEWAY_UPDATE_FAILED);
            }

            if (gateway.status !== undefined) {
              await db['MerchantGateway']
                .update({
                  status: gateway.status
                }, {
                  where: {
                    gatewayId: {
                      [db.Sequelize.Op.eq]: gateway.id
                    }
                  },
                  transaction: t
                }).catch(err => {
                  throw err;
                });
            }

            return affectedRows;
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
      if (queryParams.name) {
        condition['name'] = {
          [db.Sequelize.Op.eq]: queryParams.name
        }
      }
      if (queryParams.status !== undefined) {
        condition['status'] = {
          [db.Sequelize.Op.eq]: queryParams.status
        }
      }

      return await db['Gateway']
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