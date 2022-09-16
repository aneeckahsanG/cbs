'use strict';

//const vsprintf = require('sprintf-js').vsprintf;
const BAD_REQUEST = require('./app-codes').BAD_REQUEST;

function AppError(error, options) {
  Error.call(this);
  Error.captureStackTrace(this);

  const BAD_REQUEST_CLONE = Object.assign({}, BAD_REQUEST);
  error = Object.assign(BAD_REQUEST_CLONE, error);
  options = options || {};

  this.httpCode = error.httpCode;
  this.code = error.code;
  this.name = error.title;
  this.description = options.details || error.details || options.args || [];
}

AppError.prototype.__proto__ = Error.prototype;

module.exports.AppError = AppError;
