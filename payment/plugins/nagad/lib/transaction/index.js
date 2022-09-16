'use strict';

module.exports = async (context) => {
    return require('./nagad-payment-controller')(
        require('./nagad-payment-service')(context['db'])
    );
};