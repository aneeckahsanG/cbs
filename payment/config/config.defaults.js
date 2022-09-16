'use strict';

const config = {};
module.exports = config;

config.syncHandler = {
  fork: true,
  processInterval: 60,
  checkIntervals: [60, 10, 20, 40, 80],
  maxRetry: 5,
  limit: 20
};

config.notifyHandler = {
  fork: true,
  processInterval: 60,
  nextInterval: 60,
  maxRetry: 5,
  limit: 20
};

config.redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  db: {
    bkash: process.env.REDIS_BKASH_DB
  },
  reload: false
};