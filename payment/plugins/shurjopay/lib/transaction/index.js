'use strict';

module.exports = async (context) => {
    return require('./shurjopay-payment-controller')(
        require('./shurjopay-payment-service')(context['db'])
    );
};