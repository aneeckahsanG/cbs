'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  if (!context['portwallet'] || !context['portwallet'].baseUrl) {
    throw new ReferenceError('baseUrl required');
  }

  return require('./lib')(context['portwallet']);
};
