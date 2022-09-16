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
                    redirectUrl: `${gateway.baseUrl}/api/codero/${encryptedId}`,
                    paymentId: request.transactionId,
                    processedAmount: request.amount,
                    processedCurrency: request.currency,
                    paymentStatus: status.INITIATED,
                }
            }
        },
        'paymentCheck': async (paymentInfo) => {
            
            let checkArr = [
                'amount',
                'currency',
                'cus_name',
                'cus_email',
                'cus_phone',
                'desc'
            ];

            if ('additionalProperties' in paymentInfo) {
                if('cus_name' in paymentInfo.additionalProperties) {
                    paymentInfo['cus_name'] = paymentInfo.additionalProperties.cus_name;
                } else {
                    paymentInfo['cus_name'] = undefined;
                }

                if('cus_email' in paymentInfo.additionalProperties) {
                    paymentInfo['cus_email'] = paymentInfo.additionalProperties.cus_email;
                } else {
                    paymentInfo['cus_email'] = undefined;
                }

                if('cus_phone' in paymentInfo.additionalProperties) {
                    paymentInfo['cus_phone'] = paymentInfo.additionalProperties.cus_phone;
                } else {
                    paymentInfo['cus_phone'] = undefined;
                }

                if('desc' in paymentInfo.additionalProperties) {
                    paymentInfo['desc'] = paymentInfo.additionalProperties.desc;
                } else {
                    paymentInfo['desc'] = undefined;
                }

            } else {
                paymentInfo['cus_name'] = undefined;
                paymentInfo['cus_email'] = undefined;
                paymentInfo['cus_phone'] = undefined;
                paymentInfo['desc'] = undefined;
            }
            
            if (!checkArr.every(
              field => paymentInfo[field] !== undefined
            )) {
              throw new ReferenceError('[orderBookingId, amount, currency,cus_name,cus_email,cus_phone,desc] required');
            }
        }
    };
};