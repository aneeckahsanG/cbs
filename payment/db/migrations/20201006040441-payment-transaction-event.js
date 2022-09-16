'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const PAYMENT_TRANSACTION_EVENT = queryInterface.sequelize.options.define.tables.PaymentTransactionEvent;
    return queryInterface.createTable(PAYMENT_TRANSACTION_EVENT, {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      eventType: {
        field: 'event_type',
        type: Sequelize.ENUM('Sync-Status', 'Notify'),
        allowNull: false
      },
      eventState: {
        field: 'event_state',
        type: Sequelize.ENUM('Created', 'Processing', 'Done'),
        allowNull: false,
        defaultValue: 'Created'
      },
      eventData: {
        field: 'event_data',
        type: Sequelize.JSON,
        allowNull: true
      },
      remarks: {
        field: 'remarks',
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      retryCounter: {
        field: 'retry_counter',
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      processingAt: {
        field: 'processing_at',
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        field: 'created_at',
        allowNull: false,
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
    const PAYMENT_TRANSACTION_EVENT = queryInterface.sequelize.options.define.tables.PaymentTransactionEvent;
    return queryInterface.dropTable(PAYMENT_TRANSACTION_EVENT);
  }
};
