'use strict';

module.exports = () => {
  const db = require('../../db/models');
  
  return require('./gateway-req-res-log-controller')(
    require('./gateway-req-res-log-service')(db)
  );
};