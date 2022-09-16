'use strict';

(async () => {
  const config = require('./config');
  const db = require('./db/models');

  const notifyMerchant = require('./lib/payment-events/notify-merchant')(db);

  const notifyProcessInterval = config.notifyHandler.processInterval * 1000;

  const executor = async () => {
    await notifyMerchant(config.notifyHandler);

    setTimeout(executor, notifyProcessInterval);
  };

  setTimeout(executor, notifyProcessInterval);
})();
