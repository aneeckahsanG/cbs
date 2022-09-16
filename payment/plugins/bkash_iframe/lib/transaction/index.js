'use strict';

module.exports = async (context) => {
  return require('./bkash-controller')(
    require('./bkash-service')(context['db']),context['cache']
  );
};