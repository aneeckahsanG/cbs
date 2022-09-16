'use strict';

const moment = require('moment');
var uuid = require('uuid');
const crypto = require("crypto");
const hashEquals = require('hash-equals');
const nodeRSA = require('node-rsa');

function zeroPadWithMaxTwoDigit(number) {
  return ('00' + number).slice(-2);
}

module.exports = {
  removeUndefinedProperties(obj) {
    Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
  },
  addDaysToDateTime(days, datetime) {
    days = Number(days);
    days = days < 0 ? 0 : days;
    datetime = datetime ? new Date(datetime) : new Date();
    if (isNaN(datetime)) {
      throw new Error('Invalid datetime');
    }

    const newDateTime = new Date(datetime);
    newDateTime.setDate(newDateTime.getDate() + days);

    return newDateTime.getFullYear() + '-' +
      zeroPadWithMaxTwoDigit(newDateTime.getMonth() + 1) + '-' +
      zeroPadWithMaxTwoDigit(newDateTime.getDate()) + ' ' +
      zeroPadWithMaxTwoDigit(newDateTime.getHours()) + ':' +
      zeroPadWithMaxTwoDigit(newDateTime.getMinutes()) + ':' +
      zeroPadWithMaxTwoDigit(newDateTime.getSeconds());
  },
  removeDuplicates(array, options) {
    if (!(array instanceof Array)) {
      throw new Error('Array expected');
    }

    if (array.length === 0) {
      return array;
    }

    options = options || {};
    if (typeof array[0] !== 'object') {
      return array.filter((item, index) => array.indexOf(item) === index);
    }

    if (!options['key']) {
      throw new Error('options.key need to be provided');
    }

    const keyArray = array.map(item => item[options['key']]);
    return array.filter((item, index) => keyArray.indexOf(item[options['key']]) === index);
  },
  convertToNumber(value, options) {
    if (!value) {
      throw new Error('value can not be null/undefined');
    }

    if (!(value instanceof Array)) {
      return Number(value);
    }

    if (value.length === 0) {
      return value;
    }

    options = options || {};
    if (typeof value[0] !== 'object') {
      return value.map((item, index) => Number(item));
    }

    if (!options['key']) {
      throw new Error('options.key need to be provided');
    }

    return value.map(item => {
      item[options['key']] = Number(item[options['key']]);
      return item;
    });
  },
  async sleep(milliseconds) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  },
  toBoolean(val) {
    return String(val).toLowerCase() === 'true'
  },
  getUniqueId(){
    return uuid.v4();
  },
  checkIntegrity(content, secret, x_content_digest_b64, x_signature_b64, key) {
    var digest = crypto.createHmac("sha256", secret).update(content).digest('base64');
    var x_content_digest = new Buffer(x_content_digest_b64, 'base64');
    if (!hashEquals(digest, x_content_digest)) {
      return false;
    }
    var x_signature = new Buffer(x_signature_b64, 'base64');
    const decryptionKey = new nodeRSA(key);
    decryptionKey.setOptions({signingScheme: 'pkcs1-sha256'});
    var verification = decryptionKey.verify(digest, x_signature);
    return verification;
  },
  getPathSegment(url) {
    if (!url) return null;
    const parts = url.split('//');
    if (parts.length <= 1) return null;

    const pathSegments = parts[1].split('/');
    if (pathSegments.length <= 1) return null;

    pathSegments[0] = ''; // Remove domain part
    return pathSegments.join('/');
  }
};

