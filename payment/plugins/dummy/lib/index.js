'use strict';

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

module.exports = (gateway, db, models) => {
  let tryCounter = 0;
  const response = {
    0: () => { return {response: {paymentStatus: 'SUCCESS'}}},
    1: () => { return {response: {paymentStatus: 'PENDING'}} },
    2: () => { return {response: {paymentStatus: 'PENDING'}} },
    3: () => { return {response: {paymentStatus: 'PENDING'}} },
    4: () => { return {response: {paymentStatus: 'SUCCESS'}} }
  };

  return {
    // [Optional] Configure Payment related information
    // Any expectation failed: throw ReferenceError,
    // otherwise: Error or any error [will be treated as Internal Server Error]
    'createPaymentConfig': async (req) => {
      let found = ['name'].every((field) => req.configs[field] !== undefined);
      if (!found) throw new ReferenceError('Field(s) missing');
      const id = await models['Test']
        .create(req.configs)
        .then((created) => {
          return created.dataValues.id;
        })
        .catch(err => {
          throw new Error(err.message);
        });
      return await models['Test']
        .findByPk(id)
        .then(result => {
          return result.dataValues;
        })
        .catch(err => {
          throw new Error(err.message);
        });
    },
    'updatePaymentConfig': async (req) => {
      if (!req.id) throw new ReferenceError('id required');
      let found = ['name'].every((field) => req.configs[field] !== undefined);
      if (!found) throw new ReferenceError('Field(s) missing');
      const id = await models['Test']
        .update(req.configs, {
          where: {
            id: {
              [db.Sequelize.Op.eq]: req.id
            }
          }
        })
        .then(([affectedRows]) => {
          if (affectedRows <= 0) throw new ReferenceError('Invalid id');
        })
        .catch(err => {
          if (err instanceof ReferenceError) throw err;

          throw new Error(err.message);
        });
      return await models['Test']
        .findByPk(req.id)
        .then(result => {
          return result.dataValues;
        })
        .catch(err => {
          throw new Error(err.message);
        })
    },
    'fetchPaymentConfig': async (queryParams) => {
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
      return await models['Test']
        .findAll({
          where: condition
        })
        .then(results => {
          return results.map(result => result.dataValues);
        })
        .catch(err => {
          throw new Error(err.message);
        })
    },
    // [Implement three methods for each transaction-type
    // Naming format - 1. 'transaction-type' 2. 'transaction-type' + 'Check' 3. 'transaction-type' + 'Merge'
    // Only No. 1 is required
    'payment': async (request) => {
      return {
        op: op.CREATE,
        response: {
          gatewayTransactionId: require('uuid').v4(),
          processedAmount: request.amount,
          processedCurrency: request.currency,
          paymentStatus: status.SUCCESS,
          redirectUrl: 'http://localhost'
        }
      }
    },
    'paymentCheck': async (paymentInfo) => {
      // Throw ReferenceError if paymentInfo can not be validated
    },
    'paymentMerge': async (paymentRequest, prevPaymentTransaction) => {
      // Merged properties need to be placed in paymentRequest object
      // Throw ReferenceError if either object does not confirm the operation
    },
    // Parse notify callback
    'parseNotification': async (req) => {
      return {
        response: {
          gatewayTransactionId: req.body.gatewayTransactionId,
          paymentStatus: status.SUCCESS
        }
      }
    },
    // Returns {headers, statusCode, body}
    'replyNotification': async (req) => {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200,
        body: JSON.stringify({key: 'value', key1: 'value1'})
      }
    },
    // Fetch payment-transaction info
    'getPaymentInfo': async (req) => {
      return response[0]();
    }
  };
};
