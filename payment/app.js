'use strict';

module.exports = async () => {
  const express = require('express');
  const cookieParser = require('cookie-parser');
  const logger = require('morgan');
  const {fork} = require('child_process');
  const ejs = require('ejs');

  const config = require('./config');

  const app = express();
 
  app.set('view engine', 'ejs');
  app.set('views', [
    __dirname + '/plugins/bkash_iframe/views'
  ]);
  app.use("/public", express.static(__dirname + "/public"));
  
  process.env.NODE_ENV === 'production' || app.use(logger('dev'));

  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  app.use(cookieParser());

  const db = require('./db/models');

  const pluginManager = await require('./lib/plugin-manager')({ db: db, config: config });
  const gatewayController = require('./lib/gateway')(db, pluginManager);
  const gatewayPaymentConfigController = require('./lib/gateway-payment-config')(gatewayController, pluginManager);
  const merchantGatewayController = require('./lib/merchant-gateway')(db, gatewayController);
  const eventPublisher = require('./lib/payment-events/publish-events')(db);
  const paymentTransactionController = require('./lib/payment-transaction')(
      db, merchantGatewayController, gatewayController, eventPublisher, pluginManager, config
    );
  const cache = await require('./lib/cache')();

  await pluginManager.injectNotificationRoute({
    app: app,
    paymentTransactionService: paymentTransactionController
  });

  app.use('/api',
    require('./middlewares/set-merchant-id'),
    require('./routes/gateway')(gatewayController),
    require('./routes/gateway-payment-config')(gatewayPaymentConfigController),
    require('./routes/merchant-gateway')(merchantGatewayController),
    require('./routes/payment-transaction')(paymentTransactionController)
  );

  app.use('/api/bkash',
    await require('./plugins/bkash_iframe/routes')({db: db, cache:cache})
  );

  app.use('/api/codero',
    await require('./plugins/codero/routes')({db: db})
  );

  app.use('/api/nagad',
      await require('./plugins/nagad/routes')({db: db, cache:cache})
  );
  app.use('/api/portwallet',
      await require('./plugins/portwallet/routes')({db: db, cache:cache})
  );
  app.use('/api/shurjopay',
      await require('./plugins/shurjopay/routes')({db: db})
  );


  if (process.env.NODE_ENV === 'development') {
    app.use('/test', require('./routes/test')());
  }

  if (config.syncHandler.fork) {
    const syncHandlerProcess = fork('./sync-handler.js');
    syncHandlerProcess.on('close', (err) => {
      // Fork again
    });
    syncHandlerProcess.on('message', (message) => {
      // Log message
    });
  }

  if (config.notifyHandler.fork) {
    const notifyHandlerProcess = fork('./notify-handler.js');
    notifyHandlerProcess.on('close', (err) => {
      // Fork again
    });
    notifyHandlerProcess.on('message', (message) => {
      // Log message
    });
  }

  return app;
};
