'use strict';

module.exports = (db, gatewayService) => {
  return require('./merchant-gateway-controller')(
    require('./merchant-gateway-service')(db), gatewayService
  );
};