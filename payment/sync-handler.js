'use strict';

(async () => {
  const config = require('./config');
  const db = require('./db/models');

  const pluginManager = await require('./lib/plugin-manager')({db: db});
  const gatewayController = require('./lib/gateway')(db, pluginManager);
  const merchantGatewayController = require('./lib/merchant-gateway')(db, gatewayController);
  const eventPublisher = require('./lib/payment-events/publish-events')(db);
  const paymentTransactionController = require('./lib/payment-transaction')(
    db, merchantGatewayController, gatewayController, eventPublisher, pluginManager, config
  );

  const syncPaymentStatus = require('./lib/payment-events/sync-payment-status')(
    {db, pluginManager, paymentTransactionController, gatewayController, merchantGatewayController}
  );

  const syncProcessInterval = config.syncHandler.processInterval * 1000;

  const maxRetry = config.syncHandler.maxRetry;
  const checkIntervals = Array.isArray(config.syncHandler.checkIntervals) ?
    config.syncHandler.checkIntervals : [config.syncHandler.checkIntervals];
  const limit = config.syncHandler.limit;

  const executor = async () => {
    await syncPaymentStatus({
      checkIntervals,
      maxRetry,
      limit
    });

    setTimeout(executor, syncProcessInterval);
  };

  setTimeout(executor, syncProcessInterval);
})();
