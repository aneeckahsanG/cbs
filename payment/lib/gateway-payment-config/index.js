'use strict';

module.exports = (gatewayService, pluginManager) => {
  return require('./gateway-payment-config-controller')(gatewayService, pluginManager);
};