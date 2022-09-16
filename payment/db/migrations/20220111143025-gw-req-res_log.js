'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const GATEWAY_REQ_RES_LOG = queryInterface.sequelize.options.define.tables.GatewayReqResLog;

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(GATEWAY_REQ_RES_LOG, {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        transactionId: {
          field: 'transaction_id',
          type: Sequelize.STRING(36),
          allowNull: false
        },
        requsetData: {
          field: 'request_data',
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'You must need to insert json object for this field'
        },
        responseData: {
          field: 'response_data',
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'You must need to insert json object for this field'
        },
        additionalProperties: {
          field: 'additional_properties',
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'You must need to insert json object for this field'
        },
        createdAt: {
          field: 'created_at',
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          field: 'updated_at',
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });
  
      await queryInterface.addIndex(GATEWAY_REQ_RES_LOG, ['transaction_id'], { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    
  },
  down: async (queryInterface, Sequelize) => {
    const GATEWAY_REQ_RES_LOG = queryInterface.sequelize.options.define.tables.GatewayReqResLog;
    return queryInterface.dropTable(GATEWAY_REQ_RES_LOG);
  }
};
