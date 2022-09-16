'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('GatewayReqResLog', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      transactionId: {
        field: 'transaction_id',
        type: DataTypes.STRING(36),
        allowNull: false
      },
      requsetData: {
        field: 'request_data',
        type: DataTypes.JSON,
        allowNull: true
      },
      responseData: {
        field: 'response_data',
        type: DataTypes.JSON,
        allowNull: true
      },
      additionalProperties: {
        field: 'additional_properties',
        type: DataTypes.JSON,
        allowNull: true
      }
  }, {
    tableName: 'cbs_gw_req_res_log'
  });
};