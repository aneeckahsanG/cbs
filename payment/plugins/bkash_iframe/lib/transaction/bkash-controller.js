'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

const log = require('../../../../lib/log');
const crypto = require('../../../../lib/crypto');
const bankrequestrosponseadd = require('../../../../lib/gateway-req-res-log')();

module.exports = async (service,cache) => {
    
    const bKashApiService = await require('../service/bkash')({cache:cache});

    function getAccessKey(paymentId) {
        return crypto.encrypt(paymentId);
    }

    return {
        async index (encryptedPaymentId) {
            try{
                let paymentId = crypto.decrypt(encryptedPaymentId);

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

                return {
                    amount: paymentInfo[0].dataValues.processedAmount,
                    bkashScriptUrl: gatewayInfo[0].dataValues.additionalProperties.bkashScriptUrl,
                    paymentId: paymentId,
                    orderBookingId: paymentInfo[0].dataValues.orderBookingId,
                    redirectUrl: paymentInfo[0].additionalProperties.success_url,
                    accessKey: getAccessKey(paymentId)
                };
                
            } catch (e) {

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },

        async create (paymentId) {
            try {
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: paymentId
                });
                
                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.INITIATED) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }
                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });
                
                if(!paymentInfo || paymentInfo[0].dataValues.paymentStatus !== TRX_STATUS.INITIATED) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                await service.updatePaymentTransaction({
                    paymentStatus:TRX_STATUS.PENDING,
                    id:paymentInfo[0].dataValues.id
                });

                const context = {
                    paymentId: paymentId,
                    orderBookingId: paymentInfo[0].dataValues.orderBookingId,
                    amount: paymentInfo[0].dataValues.processedAmount,
                    currency: paymentInfo[0].dataValues.processedCurrency,
                    gatewayInfo: gatewayInfo[0].dataValues.additionalProperties,
                    merchantInfo: {
                        properties: merchantInfo[0].dataValues.additionalProperties,
                        merchantId: merchantInfo[0].dataValues.id
                    }
                };

                log.debug.debug(
                    'bKash Create API request\n'+
                    'paymentId: '+ paymentId +'\n'+
                    'Request context: '+ JSON.stringify(context)
                );
                
                let response = await bKashApiService.createPayment(context);
                
                if(response.status === 401) {
                    response = await bKashApiService.createPayment(context);
                }

                log.debug.debug(
                    'bKash Create API response\n'+
                    'paymentId: '+ paymentId +'\n'+
                    'Response: '+ JSON.stringify(response.data)
                );

                if("paymentID" in response.data) {
                    await service.updatePayment({
                        referencePaymentId: response.data.paymentID,
                        id:paymentInfo[0].dataValues.id
                    });
                }

                if("errorCode" in response.data) {
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.FAILED,
                        gatewayErrorCode: response.data.errorCode,
                        gatewayErrorMsg: JSON.stringify(response.data.errorMessage),
                        id:paymentInfo[0].dataValues.id
                    });
                }
                // console.log("Sent to data Portwallet:"+JSON.stringify(response.data));

                return response.data;

            } catch (e) {
                
                log.error.error(
                    'paymentId: '+ paymentId +
                    'error: '+ e
                );

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
            
            
        },

        async execute (paymentId) {
            try {
                
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: paymentId
                });

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
                
                

                const context = {
                    paymentId: paymentInfo[0].dataValues.referencePaymentId,
                    gatewayInfo: gatewayInfo[0].dataValues.additionalProperties,
                    merchantInfo: {
                        properties: merchantInfo[0].dataValues.additionalProperties,
                        merchantId: merchantInfo[0].dataValues.id
                    }
                };

                log.debug.debug(
                    'bKash Execute API request\n'+
                    'paymentId: '+ paymentId +'\n'+
                    'Request context: '+ JSON.stringify(context)
                );

                let response = await bKashApiService.executePayment(context);
                
                if(response.status === 401) {
                    response = await bKashApiService.executePayment(context);
                }

                log.debug.debug(
                    'bKash Execute API response\n'+
                    'paymentId: '+ paymentId +'\n'+
                    'Response: '+ JSON.stringify(response.data)
                );
                //======================db log================
                let bankrrobject = new Object();
                bankrrobject.transactionId = paymentInfo[0].dataValues.transactionId;
                bankrrobject.requsetData= JSON.stringify(context);
                bankrrobject.responseData=response.data;

                bankrequestrosponseadd.createLog(bankrrobject);
                // =================================================
                if("trxID" in response.data) {
                    await service.updatePayment({
                        gatewayTransactionId: response.data.trxID,
                        paymentStatus: TRX_STATUS.SUCCESS,
                        remarks:JSON.stringify(response.data),
                        id:paymentInfo[0].dataValues.id
                    });
                }

                if("errorCode" in response.data) {
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.FAILED,
                        gatewayErrorCode: response.data.errorCode,
                        gatewayErrorMsg: JSON.stringify(response.data.errorMessage),
                        remarks:JSON.stringify(response.data),
                        id:paymentInfo[0].dataValues.id
                    });
                }

                return response.data;
            } catch (e) {
                
                log.error.error(
                    'paymentId: '+ paymentId +
                    'error: '+ e
                );

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },

        async cancel(paymentId) {
            try {
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: paymentId
                });

                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus === TRX_STATUS.FAILED) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }

                await service.updatePayment({
                    paymentStatus: TRX_STATUS.CANCELLED,
                    id:paymentInfo[0].dataValues.id
                });

                log.debug.debug(
                    'bKash Cancel Transaction\n'+
                    'paymentId: '+ paymentId +'\n'
                );

            } catch (e) {

                log.error.error(
                    'paymentId: '+ paymentId +
                    'error: '+ e
                );

                if(e instanceof AppError) {
                    throw e;
                }

                throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
            }
        },

        validateAccessKey(paymentId, accessKey){
            if(getAccessKey(paymentId) === accessKey) {
                return true;
            } else {
                return false;
            }
        }
    }
}