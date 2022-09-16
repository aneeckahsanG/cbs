'use strict';

const config = require('./config.defaults');
module.exports = config;

config.invalidateGatewayCacheAfter = 600;

config.syncHandler.fork = false;
config.syncHandler.processInterval = 5;
config.syncHandler.maxRetry = 5;

config.notifyHandler.fork = false;
config.notifyHandler.processInterval = 5;
config.notifyHandler.nextInterval = 5;
config.notifyHandler.maxRetry = 3;

