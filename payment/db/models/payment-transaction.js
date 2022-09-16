'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PaymentTransaction', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    transactionType: {
      field: 'transaction_type',
      type: DataTypes.STRING,
      allowNull: false
    },
    transactionId: {
      field: 'transaction_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    orderBookingId: {
      field: 'order_booking_id',
      type: DataTypes.STRING,
      allowNull: true
    },
    referencePaymentId: {
      field: 'reference_payment_id',
      type: DataTypes.STRING,
      allowNull: true
    },
    merchantTransactionId: {
      field: 'merchant_transaction_id',
      type: DataTypes.STRING,
      allowNull: true //previously false
    },
    gatewayTransactionId: {
      field: 'gateway_transaction_id',
      type: DataTypes.STRING,
      allowNull: true
    },
    accountId: {
      field: 'account_id',
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(20, 6),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    processedAmount: {
      field: 'processed_amount',
      type: DataTypes.DECIMAL(20, 6),
      allowNull: false
    },
    processedCurrency: {
      field: 'processed_currency',
      type: DataTypes.STRING(36),
      allowNull: false
    },
    paymentStatus: {
      field: 'payment_status',
      type: DataTypes.ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN', 'CANCELLED'),
      allowNull: false
    },
    gatewayErrorCode: {
      field: 'gateway_error_code',
      type: DataTypes.STRING(32),
      allowNull: true
    },
    gatewayErrorMsg: {
      field: 'gateway_error_msg',
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    remarks: {
      field: 'remarks',
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    gatewayParams: {
      field: 'gateway_params',
      type: DataTypes.JSON,
      allowNull: true
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    merchantCallbackUrl: {
      field: 'merchant_callback_url',
      type: DataTypes.STRING,
      allowNull: true
    },
    gatewayId: {
      field: 'gateway_id',
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    merchantId: {
      field: 'merchant_id',
      type: DataTypes.STRING,
      allowNull: false
    },
    additionalProperties: {
      field: 'additional_properties',
      type: DataTypes.JSON,
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
    tableName: 'payment_transaction'
  });
};