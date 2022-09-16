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
                    // redirectUrl: `${gateway.baseUrl}/api/shurjopay/index/${encryptedId}`,
                    // redirectUrl: `http://localhost:7085/api/composition/api/shurjopay/index/${encryptedId}`,
                    // redirectUrl: `${gateway.baseUrl}/composition/api/shurjopay/index/${encryptedId}`,
                    redirectUrl: `${gateway.baseUrl}/shurjopay/index/${encryptedId}`,
                    paymentId: request.transactionId,
                    processedAmount: request.amount,
                    processedCurrency: request.currency,
                    paymentStatus: status.INITIATED,
                }
            }
        },
        /*'paymentCheck': async (paymentInfo) => {
            
            let checkArr = [
                'mcnt_Amount',
                'mcnt_TxnNo',
                'mcnt_OrderNo',
                'mcnt_ShortName',
                'mcnt_ShopId',
                'mcnt_SecureHashValue',
                'cust_CustomerName',
                'mcnt_Currency'
            ];

            if ('additionalProperties' in paymentInfo) {
                if('cust_CustomerName' in paymentInfo.additionalProperties) {
                    paymentInfo['cust_CustomerName'] = paymentInfo.additionalProperties.cust_CustomerName;
                } else {
                    paymentInfo['cust_CustomerName'] = undefined;
                }
                if('mcnt_ShortName' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_ShortName'] = paymentInfo.additionalProperties.mcnt_ShortName;
                } else {
                    paymentInfo['mcnt_ShortName'] = undefined;
                }
                if('mcnt_TxnNo' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_TxnNo'] = paymentInfo.additionalProperties.mcnt_TxnNo;
                } else {
                    paymentInfo['mcnt_TxnNo'] = undefined;
                }

                if('mcnt_OrderNo' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_OrderNo'] = paymentInfo.additionalProperties.mcnt_OrderNo;
                } else {
                    paymentInfo['mcnt_OrderNo'] = undefined;
                }

                if('mcnt_ShopId' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_ShopId'] = paymentInfo.additionalProperties.mcnt_ShopId;
                } else {
                    paymentInfo['mcnt_ShopId'] = undefined;
                }
                if('mcnt_SecureHashValue' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_SecureHashValue'] = paymentInfo.additionalProperties.mcnt_SecureHashValue;
                } else {
                    paymentInfo['mcnt_SecureHashValue'] = undefined;
                }
                if('mcnt_Currency' in paymentInfo.additionalProperties) {
                    paymentInfo['mcnt_Currency'] = paymentInfo.additionalProperties.mcnt_Currency;
                } else {
                    paymentInfo['mcnt_Currency'] = undefined;
                }

            }
            else {
                paymentInfo['cust_CustomerName'] = undefined;
                paymentInfo['mcnt_TxnNo'] = undefined;
                paymentInfo['mcnt_OrderNo'] = undefined;
                paymentInfo['mcnt_ShopId'] = undefined;
                paymentInfo['mcnt_ShortName']=undefined;
                paymentInfo['mcnt_SecureHashValue']=undefined;
                paymentInfo['mcnt_Currency']=undefined;
            }
            
            if (!checkArr.every(
              field => paymentInfo[field] !== undefined
            )) {
                //console.log("TEst");
                throw new ReferenceError('[orderBookingId, cust_CustomerName, mcnt_TxnNo,mcnt_OrderNo,mcnt_ShopId,mcnt_ShortName,mcnt_SecureHashValue,mcnt_Currency] required');
            }
        }*/
    };
};