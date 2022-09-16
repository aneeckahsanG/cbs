'use strict';

module.exports = (db, merchantGatewayService, gatewayService, eventPublisher, pluginManager, config) => {
  return require('./payment-transaction-controller')(
    require('./payment-transaction-service')(db),
    merchantGatewayService, gatewayService, eventPublisher, pluginManager, config
  );
};