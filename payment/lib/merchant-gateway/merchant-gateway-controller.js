'use strict';

const constants = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (merchantGatewayService, gatewayService) => {

  return {
    async createMerchantGateway(merchantGateway) {
      try {
        const gateways = await gatewayService.fetchGateway({
          id: merchantGateway.gatewayId,
          status: constants.ACTIVE
        });
        if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);

        const ret = await merchantGatewayService.create(merchantGateway);
        return await merchantGatewayService.fetch({ id: ret });
      } catch (e) {
        throw e;
      }
    },
    async updateMerchantGateway(merchantGateway) {
      const merchantGateways = await merchantGatewayService.fetch({ id: merchantGateway.id });
      if (merchantGateways.length === 0) throw new AppError(appCodes.INVALID_MERCHANT_GATEWAY_ID);

      try {
        if (merchantGateway.gatewayId) {
          const gateways = await gatewayService.fetchGateway({
            id: merchantGateway.gatewayId,
            status: constants.ACTIVE
          });
          if (gateways.length === 0) throw new AppError(appCodes.INVALID_PAYMENT_GATEWAY_ID);
        }

        await merchantGatewayService.update(merchantGateway);
        return await merchantGatewayService.fetch({ id: merchantGateway.id });
      } catch (e) {
        throw e;
      }
    },
    async fetchMerchantGateway(queryParams) {
      try {
        return await merchantGatewayService.fetch(queryParams);
      } catch (e) {
        throw e;
      }
    },
    async fetchMerchantGatewayDetails({merchantId, gatewayId}) {
      try {
        return await merchantGatewayService.fetchMerchantGatewayDetails({merchantId, gatewayId});
      } catch (e) {
        throw e;
      }
    }
  }
};