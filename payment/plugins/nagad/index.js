'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  if (!context['nagad'] || !context['nagad'].baseUrl) {
    throw new ReferenceError('baseUrl required');
  }

  return require('./lib')(context['nagad']);
};
