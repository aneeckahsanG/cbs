'use strict';

module.exports = (req, res, next) => {
  const url = req.url.split('?')[0];
  if (url === '/payment-transaction') {
	!req.body.merchantId && (req.body.merchantId = req.body.appId || 'NA');
    !req.query.merchantId && (req.query.merchantId = req.body.appId || 'NA');
  }
  delete req.body.appId;
  delete req.query.appId;
  next();
};