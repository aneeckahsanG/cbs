'use strict';

module.exports = async (context) => {
  const pluginManager = require('./plugin-manager')(context);
  await pluginManager.initialize();

  return {
    injectNotificationRoute: pluginManager.injectNotificationRoute,
    load: pluginManager.load,
    reload: pluginManager.reload,
    get: pluginManager.get,
    getOrLoad: pluginManager.getOrLoad,
  }
};
