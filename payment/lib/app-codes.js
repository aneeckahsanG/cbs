'use strict';

const httpCodes = require('./http-codes');

module.exports = {
  SUCCESS: {
    httpCode: httpCodes.OK.code,
    code: 0,
    title: 'Success',
    details: 'Success'
  },
  INVALID_PAYMENT_GATEWAY_ID: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 1,
    title: httpCodes.BAD_REQUEST.msg,
    details: "Invalid Payment-Gateway Id"
  },
  INVALID_MERCHANT_GATEWAY_ID: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 2,
    title: httpCodes.BAD_REQUEST.msg,
    details: "Invalid Merchant-Gateway-Id"
  },
  DUPLICATE_GATEWAY_NAME: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 3,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Duplicate Gateway name'
  },
  GATEWAY_UPDATE_FAILED: {
    httpCode: httpCodes.PRECONDITION_FAILED.code,
    code: 4,
    title: httpCodes.PRECONDITION_FAILED.msg,
    details: 'Gateway update failed'
  },
  INVALID_GATEWAY_NAME: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 5,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Invalid Gateway name'
  },
  INVALID_GATEWAY_PROPERTIES: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 6,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Invalid Gateway properties'
  },
  OPERATION_NOT_SUPPORTED: {
    httpCode: httpCodes.METHOD_NOT_ALLOWED.code,
    code: 7,
    title: httpCodes.METHOD_NOT_ALLOWED.msg,
    details: 'Operation is not supported'
  },
  PAYMENT_GATEWAY_ID_REQUIRED: {
    httpCode: httpCodes.EXPECTATION_FAILED.code,
    code: 8,
    title: httpCodes.EXPECTATION_FAILED.msg,
    details: 'Payment Gateway-Id required'
  },
  GATEWAY_REJECT_PAYMENT_CONFIG: {
    httpCode: httpCodes.EXPECTATION_FAILED.code,
    code: 9,
    title: httpCodes.EXPECTATION_FAILED.msg,
    details: 'Gateway rejects Payment-Config'
  },
  MERCHANT_ID_GATEWAY_ID_NEED_TO_BE_UNIQUE: {
    httpCode: httpCodes.EXPECTATION_FAILED.code,
    code: 10,
    title: httpCodes.EXPECTATION_FAILED.msg,
    details: 'Together Merchant-Id & Gateway-Id need to be unique'
  },
  MERCHANT_GATEWAY_UPDATE_FAILED: {
    httpCode: httpCodes.EXPECTATION_FAILED.code,
    code: 11,
    title: httpCodes.EXPECTATION_FAILED.msg,
    details: 'Merchant Gateway update failed'
  },
  INVALID_MERCHANT_OR_GATEWAY_ID: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 12,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Invalid Merchant or Gateway-Id'
  },
  TRANSACTION_TYPE_NOT_SUPPORTED: {
    httpCode: httpCodes.METHOD_NOT_ALLOWED.code,
    code: 13,
    title: httpCodes.METHOD_NOT_ALLOWED.msg,
    details: 'Transaction-Type is not supported'
  },
  MALFORMED_OR_INSUFFICIENT_PAYMENT_INFO: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 14,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Malformed or insufficient Payment Information'
  },
  PAYMENT_TRANSACTION_UPDATE_FAILED: {
    httpCode: httpCodes.PRECONDITION_FAILED.code,
    code: 15,
    title: httpCodes.PRECONDITION_FAILED.msg,
    details: 'Payment-Transaction update failed'
  },
  INVALID_PAYMENT_TRANSACTION: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 16,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Invalid Payment-Transaction'
  },
  EXISTS_BOOKING_ID: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 17,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Booking-ID Already Exists'
  },
  TEMPERED_PAYMENT: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 18,
    title: httpCodes.BAD_REQUEST.msg,
    details: 'Payment Tempered'
  },
  NOT_FOUND_LOG_DATA: {
    httpCode: httpCodes.NOT_FOUND.code,
    code: 19,
    title: httpCodes.NOT_FOUND.msg,
    details: httpCodes.NOT_FOUND.msg
  },
  LOG_UPDATE_FAILED: {
    httpCode: httpCodes.PRECONDITION_FAILED.code,
    code: 20,
    title: httpCodes.PRECONDITION_FAILED.msg,
    details: 'Log update failed'
  },
  NOT_FOUND: {
    httpCode: httpCodes.NOT_FOUND.code,
    code: 253,
    title: httpCodes.NOT_FOUND.msg,
    details: httpCodes.NOT_FOUND.msg
  },
  BAD_REQUEST: {
    httpCode: httpCodes.BAD_REQUEST.code,
    code: 254,
    title: httpCodes.BAD_REQUEST.msg,
    details: httpCodes.BAD_REQUEST.msg
  },
  INTERNAL_SERVER_ERROR: {
    httpCode: httpCodes.INTERNAL_SERVER_ERROR.code,
    code: 255,
    title: httpCodes.INTERNAL_SERVER_ERROR.msg,
    details: httpCodes.INTERNAL_SERVER_ERROR.msg
  }
};