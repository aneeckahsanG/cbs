'use strict';

module.exports = (sequelize, DataTypes) => {
  const MerchantGateway = sequelize.define('MerchantGateway', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    merchantId: {
      field: 'merchant_id',
      type: DataTypes.STRING,
      allowNull: false
    },
    gatewayId: {
      field: 'gateway_id',
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    additionalProperties: {
      field: 'additional_properties',
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    callbackUrl: {
      field: 'callback_url',
      type: DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'merchant_gateway'
  });

  MerchantGateway.associate = function(models) {
    MerchantGateway.belongsTo(models['Gateway'], {foreignKey: 'gatewayId'});
  };

  return MerchantGateway;
};