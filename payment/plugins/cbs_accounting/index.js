'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  if (!context['cbs_accounting'] || !context['cbs_accounting'].baseUrl) {
    throw new ReferenceError('baseUrl required');
  }
  return require('./lib')(context['cbs_accounting']);
};
