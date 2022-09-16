'use strict';

module.exports = async (context) => {
  return require('./codero-controller')(
    require('./codero-service')(context['db'])
  );
};