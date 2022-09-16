'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

const log = require('../../../../lib/log');
const deccryption = require('../../../../lib/crypto');

module.exports = async (service) => {

    const coderoApiService = await require('../service/codero')();

    return {
        async index(encryptedPaymentId) {
            try{
                let paymentId = deccryption.decrypt(encryptedPaymentId);

                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: paymentId
                });

                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.INITIATED) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                if(paymentInfo[0].dataValues.orderBookingId) {
                    const paymentByOrder = await service.fetchPaidPaymentByOrder({
                        orderBookingId: paymentInfo[0].dataValues.orderBookingId,
                        merchantId:paymentInfo[0].dataValues.merchantId
                    });

                    if(paymentByOrder.length) {
                        throw new AppError(appCodes.EXISTS_BOOKING_ID);
                    }
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                const postData = {
                    store_id: merchantInfo[0].dataValues.additionalProperties.store_id,
                    tran_id: paymentId,
                    success_url: gatewayInfo[0].dataValues.baseUrl+'/api/codero/success',
                    fail_url: gatewayInfo[0].dataValues.baseUrl+'/api/codero/fail',
                    cancel_url: gatewayInfo[0].dataValues.baseUrl+'/api/codero/cancel',
                    amount:parseFloat(paymentInfo[0].dataValues.processedAmount).toFixed(2),
                    currency: paymentInfo[0].dataValues.processedCurrency,
                    signature_key: merchantInfo[0].dataValues.additionalProperties.signature_key,
                    cus_name: paymentInfo[0].dataValues.additionalProperties.cus_name,
                    cus_email: paymentInfo[0].dataValues.additionalProperties.cus_email,
                    cus_phone: paymentInfo[0].dataValues.additionalProperties.cus_phone,
                    desc: paymentInfo[0].dataValues.additionalProperties.desc
                };

                log.debug.debug(
                    'Codero Index API:'+'\n'+
                    'paymentID: '+ paymentId + '\n'+
                    'Request Body: ' + JSON.stringify(postData)
                );

                const context = {
                    data:postData,
                    gatewayInfo: gatewayInfo[0].dataValues.additionalProperties,
                    merchantInfo: {
                        properties: merchantInfo[0].dataValues.additionalProperties,
                        merchantId: merchantInfo[0].dataValues.id
                    }
                };
                
                let response = await coderoApiService.createPayment(context);
                
                if(response.status === 200) {
                    let url = new URL(response.data);
                    
                    log.debug.debug(
                        'Codero Index API:'+'\n'+
                        'paymentID: '+ paymentId + '\n'+
                        'Response url: ' + response.data
                    );

                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.PENDING,
                        id:paymentInfo[0].dataValues.id
                    });

                    return response.data;
                } else {
                    throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
                }
            } catch (e) {
                
                log.error.error(e);

                if(e instanceof TypeError) {
                    e['name'] = 'Invalid url';
                    e['description'] = 'Index API generates invalid url'
                    throw e;
                }

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },
        async success(data) {
            try {
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: data.mer_txnid
                });
                
                log.debug.debug(
                    'Codero success call\n'+
                    'paymentId: ' + data.mer_txnid +'\n'+
                    'Request data: ' + JSON.stringify(data)
                );

                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.PENDING) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                await service.updatePayment({
                    gatewayTransactionId: data.bank_txn,
                    referencePaymentId:data.epw_txnid,
                    id:paymentInfo[0].dataValues.id
                });

                const lookupRes = await coderoApiService.lookup({
                    store_id: merchantInfo[0].dataValues.additionalProperties.store_id,
                    signature_key: merchantInfo[0].dataValues.additionalProperties.signature_key,
                    request_id: data.mer_txnid,
                    type:'json'
                });

                if(lookupRes.status === 200) {

                    log.debug.debug(
                        'Codero lookup call\n'+
                        'paymentId: ' + data.mer_txnid +'\n'+
                        'Response: ' + JSON.stringify(lookupRes.data)
                    );

                    if(lookupRes.data.pay_status === data.pay_status) {
                        await service.updatePayment({
                            paymentStatus: TRX_STATUS.SUCCESS,
                            id:paymentInfo[0].dataValues.id
                        });
                    }else {
                        throw new AppError(appCodes.TEMPERED_PAYMENT);
                    }
                }

                return merchantInfo[0].dataValues.callbackUrl + '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment successful';

            } catch (e) {

                log.error.error(
                    'paymentId: '+ data.mer_txnid +
                    'error: '+ e
                );

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },
        async fail(data) {
        
            try {
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: data.mer_txnid
                });
                
                log.debug.debug(
                    'Codero fail call\n'+
                    'paymentId: ' + data.mer_txnid +'\n'+
                    'Request data: ' + JSON.stringify(data)
                );

                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.PENDING) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                await service.updatePayment({
                    paymentStatus: TRX_STATUS.FAILED,
                    gatewayTransactionId: data.bank_txn,
                    referencePaymentId:data.epw_txnid,
                    id:paymentInfo[0].dataValues.id
                });
                
                return merchantInfo[0].dataValues.callbackUrl + '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=failed&msg=Payment fail';
            } catch (e) {
                
                log.error.error(
                    'paymentId: '+ data.mer_txnid +
                    'error: '+ e
                );

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },
        async cancel(data) {
            try {
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: data.mer_txnid
                });
                
                log.debug.debug(
                    'Codero cancel call\n'+
                    'paymentId: ' + data.mer_txnid +'\n'+
                    'Request data: ' + JSON.stringify(data)
                );

                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.PENDING) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                await service.updatePayment({
                    paymentStatus: TRX_STATUS.CANCELLED,
                    gatewayTransactionId: data.bank_txn,
                    referencePaymentId:data.epw_txnid,
                    id:paymentInfo[0].dataValues.id
                });

                return merchantInfo[0].dataValues.callbackUrl + '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=cancelled&msg=Payment cancel';
            } catch (e) {

                log.error.error(
                    'paymentId: '+ data.mer_txnid +
                    'error: '+ e
                );
                
                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        }
    }
}