'use strict';
const encryption = require('../../../lib/crypto');

const op = {
    VOID: 0,
    CREATE: 1
};

const status = {
    INITIATED: 'INITIATED',
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    Cancel: 'Cancel',
    UNKNOWN: 'UNKNOWN'
};

module.exports = (gateway) => {
    return {
        'payment': async (request) => {
            let encryptedId = encryption.encrypt(request.transactionId);

            return {
                op: op.VOID,
                response: {
                    redirectUrl: `${gateway.baseUrl}/api/nagad/${encryptedId}`,
                    // redirectUrl: `http://localhost:7085/api/composition/api/nagad/index/${encryptedId}`,
                    // redirectUrl: `${gateway.baseUrl}/composition/api/nagad/index/${encryptedId}`,
                    // redirectUrl: `${gateway.baseUrl}/nagad/index/${encryptedId}`,
                    paymentId: request.transactionId,
                    processedAmount: request.amount,
                    processedCurrency: request.currency,
                    paymentStatus: status.INITIATED,
                }
            }
        },
    };
};