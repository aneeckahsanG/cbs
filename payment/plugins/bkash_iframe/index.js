'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  if (!context['bkash_iframe'] || !context['bkash_iframe'].baseUrl) {
    throw new ReferenceError('baseUrl required');
  }

  return require('./lib')(context['bkash_iframe']);
};
