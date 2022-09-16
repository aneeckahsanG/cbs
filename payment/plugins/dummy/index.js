'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  const models = require('./models')(context['db']);
  return require('./lib')(context['dummy'], context['db'], models);
};