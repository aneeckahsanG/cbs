'use strict';

const constants = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (gatewayService, pluginManager) => {

  return {
    async createGatewayPaymentConfig(config) {
      try {
        const gateways = await gatewayService.fetchGateway({id: config.gatewayId});
        if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

        const gateway = gateways[0];
        const plugin = await pluginManager.getOrLoad(gateway.name);

        if (!plugin['createPaymentConfig']) throw new AppError(appCodes.OPERATION_NOT_SUPPORTED);
        return await plugin['createPaymentConfig'](config);
      } catch (e) {
        if (e instanceof ReferenceError) {
          throw new AppError(appCodes.GATEWAY_REJECT_PAYMENT_CONFIG, {details: e.message});
        }

        throw e;
      }
    },
    async updateGatewayPaymentConfig(config) {
      try {
        const gateways = await gatewayService.fetchGateway({id: config.gatewayId});
        if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

        const gateway = gateways[0];
        const plugin = await pluginManager.getOrLoad(gateway.name);

        if (!plugin['updatePaymentConfig']) throw new AppError(appCodes.OPERATION_NOT_SUPPORTED);
        return await plugin['updatePaymentConfig'](config);
      } catch (e) {
        if (e instanceof ReferenceError) {
          throw new AppError(appCodes.GATEWAY_REJECT_PAYMENT_CONFIG, {details: e.message});
        }

        throw e;
      }
    },
    async fetchGatewayPaymentConfig(queryParams) {
      try {
        if (!queryParams.gatewayId) throw new AppError(appCodes.PAYMENT_GATEWAY_ID_REQUIRED);
        const gateways = await gatewayService.fetchGateway({id: queryParams.gatewayId});
        if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

        const gateway = gateways[0];
        const plugin = await pluginManager.getOrLoad(gateway.name);

        if (!plugin['fetchPaymentConfig']) throw new AppError(appCodes.OPERATION_NOT_SUPPORTED);
        return await plugin['fetchPaymentConfig'](queryParams);
      } catch (e) {
        throw e;
      }
    }
  }
};
