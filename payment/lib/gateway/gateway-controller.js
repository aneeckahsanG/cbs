'use strict';

const constants = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (gatewayService, pluginManager) => {

  return {
    async createGateway(gateway) {
      try {
        const plugin = pluginManager.get(gateway.name);
        if (!plugin) await pluginManager.load(gateway);

        const ret = await gatewayService.create(gateway);
        return await gatewayService.fetch({ id: ret });
      } catch (e) {
        throw e;
      }
    },
    async updateGateway(gateway) {
      const prevGateways = await gatewayService.fetch({ id: gateway.id });
      if (prevGateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

      const newGateway = Object.assign(prevGateways[0], gateway);
      try {
        await pluginManager.reload(newGateway);
        await gatewayService.update(gateway);
        return await gatewayService.fetch({ id: gateway.id });
      } catch (e) {
        throw e;
      }
    },
    async fetchGateway(queryParams) {
      try {
        return await gatewayService.fetch(queryParams);
      } catch (e) {
        throw e;
      }
    }
  }
};