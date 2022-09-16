'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const PAYMENT_TRANSACTION = queryInterface.sequelize.options.define.tables.PaymentTransaction;
    return queryInterface.createTable(PAYMENT_TRANSACTION, {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      transactionType: {
        field: 'transaction_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      transactionId: {
        field: 'transaction_id',
        type: Sequelize.STRING(36),
        allowNull: false
      },
      orderBookingId: {
        field: 'order_booking_id',
        type: Sequelize.STRING,
        allowNull: true
      },
      referencePaymentId: {
        field: 'reference_payment_id',
        type: Sequelize.STRING,
        allowNull: true
      },
      merchantTransactionId: {
        field: 'merchant_transaction_id',
        type: Sequelize.STRING,
        allowNull: true
      },
      gatewayTransactionId: {
        field: 'gateway_transaction_id',
        type: Sequelize.STRING,
        allowNull: true
      },
      accountId: {
        field: 'account_id',
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(20, 6),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(36),
        allowNull: false
      },
      processedAmount: {
        field: 'processed_amount',
        type: Sequelize.DECIMAL(20, 6),
        allowNull: false
      },
      processedCurrency: {
        field: 'processed_currency',
        type: Sequelize.STRING(36),
        allowNull: false
      },
      paymentStatus: {
        field: 'payment_status',
        type: Sequelize.ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN', 'CANCELLED'),
        allowNull: false
      },
      gatewayErrorCode: {
        field: 'gateway_error_code',
        type: Sequelize.STRING(32),
        allowNull: true
      },
      gatewayErrorMsg: {
        field: 'gateway_error_msg',
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      remarks: {
        field: 'remarks',
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      gatewayParams: {
        field: 'gateway_params',
        type: Sequelize.JSON,
        allowNull: true
      },
      channel: {
        type: Sequelize.STRING,
        allowNull: false
      },
      merchantCallbackUrl: {
        field: 'merchant_callback_url',
        type: Sequelize.STRING,
        allowNull: true
      },
      gatewayId: {
        field: 'gateway_id',
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      merchantId: {
        field: 'merchant_id',
        type: Sequelize.STRING,
        allowNull: false
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
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      }
    });

  },
  down: async (queryInterface, Sequelize) => {
    const PAYMENT_TRANSACTION = queryInterface.sequelize.options.define.tables.PaymentTransaction;
    return queryInterface.dropTable(PAYMENT_TRANSACTION);
  }
};
