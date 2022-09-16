'use strict';

module.exports = (db, pluginManager) => {
  return require('./gateway-controller')(
    require('./gateway-service')(db), pluginManager
  );
};