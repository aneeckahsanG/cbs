'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PaymentTransactionEvent', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    eventType: {
      field: 'event_type',
      type: DataTypes.ENUM('Sync-Status', 'Notify'),
      allowNull: false
    },
    eventState: {
      field: 'event_state',
      type: DataTypes.ENUM('Created', 'Processing', 'Done'),
      allowNull: false,
      defaultValue: 'Created'
    },
    eventData: {
      field: 'event_data',
      type: DataTypes.JSON,
      allowNull: true
    },
    remarks: {
      field: 'remarks',
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    retryCounter: {
      field: 'retry_counter',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    processingAt: {
      field: 'processing_at',
      type: DataTypes.DATE,
      allowNull: false
    },
    createdAt: {
      field: 'created_at',
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    tableName: 'payment_transaction_event',
    timestamps: false
  });
};