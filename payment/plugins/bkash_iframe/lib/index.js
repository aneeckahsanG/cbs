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
    UNKNOWN: 'UNKNOWN'
};

module.exports = (gateway) => {
    return {
        'payment': async (request) => {
            let encryptedId = encryption.encrypt(request.transactionId);

            return {
                op: op.VOID,
                response: {
                    redirectUrl: `${gateway.baseUrl}/api/bkash/${encryptedId}`,
                    paymentId: request.transactionId,
                    processedAmount: request.amount,
                    processedCurrency: request.currency,
                    paymentStatus: status.INITIATED,
                }
            }
        },
        'paymentCheck': async (paymentInfo) => {
            
            let checkArr = [
                'orderBookingId',
                'amount',
                'currency'
            ];

            if (!checkArr.every(
              field => paymentInfo[field] !== undefined
            )) {
              throw new ReferenceError('[orderBookingId, amount, currency] required');
            }
        }
    };
};