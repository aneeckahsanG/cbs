'use strict';

module.exports = (context) => {
  // Check gateway properties. Gateway properties will be found in context[`gateway-name`]
  /*
  clientId,
  clientSecret,
  username,
  password
   */
  if (!context['ghoori'].additionalProperties) throw new ReferenceError('additionalProperties required');
  if (!['clientId', 'clientSecret', 'username', 'password', 'package', 'callbackUrl'].every(
    field => context['ghoori'].additionalProperties[field] !== undefined
  )) {
    throw new ReferenceError('[clientId, clientSecret, username, password, package, callbackUrl] required');
  }

  return require('./lib')(context['ghoori']);
};