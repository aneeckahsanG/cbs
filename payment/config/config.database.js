'use strict';

require('dotenv').config();

const TABLES = {
  Gateway: 'cbs_gateway',
  MerchantGateway: 'cbs_merchant_gateway',
  PaymentTransaction: 'cbs_payment_transaction',
  PaymentTransactionEvent: 'cbs_payment_transaction_event',
  GatewayReqResLog: 'cbs_gw_req_res_log',
};

module.exports = {
  "development": {
    username: "ubuntuvm",
    password: "ubuntuvm",
    database: "cbs",
    host: "127.0.0.1",
    port: 3306,
    dialect: "mysql",
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      // useUTC: false,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type == 'TIMESTAMP') {
          return field.string()
        }
        return next()
      }
    },
    define: {
      underscored: true,
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      },
      timestamps: true,
      tables: TABLES,
    },
      logging: false,
    timezone: process.env.TIMEZONE || "+06:00"
  },
  "test": {
    username: "root",
    password: "root",
    database: "payment_test",
    host: "127.0.0.1",
    port: 3306,
    dialect: "mysql",
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      // useUTC: false,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type == 'TIMESTAMP') {
          return field.string()
        }
        return next()
      }
    },
    define: {
      underscored: true,
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      },
      timestamps: true,
      tables: TABLES,
    },
    logging: false,
    timezone: process.env.TIMEZONE || "+06:00"
  },
  "production": {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      // useUTC: false,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type == 'TIMESTAMP') {
          return field.string()
        }
        return next()
      }
    },
    define: {
      underscored: true,
      charset: 'utf8',
      dialectOptions: {
          collate: 'utf8_general_ci'
      },
      timestamps: true,
      tables: TABLES,
    },
    logging: false,
    timezone: process.env.TIMEZONE || "+06:00"
  }
};
