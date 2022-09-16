'use strict';

module.exports = async (context) => {
    return require('./portwallet-payment-controller')(
        require('./portwallet-payment-service')(context['db'])
    );
};