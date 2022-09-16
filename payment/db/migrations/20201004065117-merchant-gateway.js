'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const MERCHANT_GATEWAY = queryInterface.sequelize.options.define.tables.MerchantGateway;
    return queryInterface.createTable(MERCHANT_GATEWAY, {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      merchantId: {
        field: 'merchant_id',
        type: Sequelize.STRING,
        allowNull: false
      },
      gatewayId: {
        field: 'gateway_id',
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      callbackUrl: {
        field: 'callback_url',
        type: Sequelize.STRING,
        allowNull: true
      },
      additionalProperties: {
        field: 'additional_properties',
        type: Sequelize.JSON,
        allowNull: true
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.STRING,
        allowNull: false
      },
      updatedBy: {
        field: 'updated_by',
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        field: 'created_at',
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE
      }
    }, {
      uniqueKeys: {
        merchant_id_gw_id: {
          fields: [ 'merchant_id', 'gateway_id' ]
        }
      },
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    const MERCHANT_GATEWAY = queryInterface.sequelize.options.define.tables.MerchantGateway;
    return queryInterface.dropTable(MERCHANT_GATEWAY);
  }
};
