'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

const log = require('../../../../lib/log');
const deccryption = require('../../../../lib/crypto');
const bankrequestrosponseadd = require('../../../../lib/gateway-req-res-log')();

// const crypto = __importStar(require("crypto"));
// const fs = __importStar(require("fs"));
const request_1 = require("../../dist/utils/request");

const NagadGateway = require('../../../../node_modules/nagad-payment-gateway');

module.exports = async (service) => {
    const coderoApiService = await require('../service/nagad-payment')();

    return {
        async index(encryptedPaymentId) {
            try{

                let paymentId = deccryption.decrypt(encryptedPaymentId);
                const paymentInfo = await service.fetchPaymentInfo({
                    transactionId: paymentId
                });
                if(!paymentInfo.length || paymentInfo[0].dataValues.paymentStatus == TRX_STATUS.SUCCESS) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }
                // if(paymentInfo[0].dataValues.additionalProperties.GW!=='NAGAD'|| paymentInfo[0].dataValues.additionalProperties.CardType!=='MB'){
                //     throw new AppError(appCodes.INVALID_PAYMENT_REQUEST_PARAMETER);
                // }
                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                var fs =require("fs");
                var config = {
                    apiVersion: 'v-0.2.0',
                    baseURL: gatewayInfo[0].dataValues.additionalProperties.BaseURL,
                    callbackURL: gatewayInfo[0].dataValues.baseUrl+'/api/nagad/callback/'+paymentId,
                    merchantID: merchantInfo[0].dataValues.additionalProperties.BankMerchantId,
                    merchantNumber:merchantInfo[0].dataValues.additionalProperties.accountNumber,
                    privKey:  merchantInfo[0].dataValues.additionalProperties.private_key,
                    pubKey:  merchantInfo[0].dataValues.additionalProperties.public_key,
                };
                const nagad = new NagadGateway(config);
                const result = Number(paymentInfo[0].dataValues.amount).toFixed(2);
                const orderId=(Date.now()).toString();
                const dataconfig = {
                    amount: result,
                    ip: gatewayInfo[0].dataValues.additionalProperties.gatewayIP,
                    orderId: orderId,
                    productDetails: paymentInfo[0].dataValues.additionalProperties.cust_CustomerServiceName,
                    clientType: 'PC_WEB',
                };

                const nagadURLdata = await nagad.createPayment({
                    amount: result,
                    ip: gatewayInfo[0].dataValues.additionalProperties.gatewayIP,
                    orderId: orderId,
                    productDetails: paymentInfo[0].dataValues.additionalProperties.cust_CustomerServiceName,
                    clientType: 'PC_WEB',
                });
                console.log("nagadURLdata:"+JSON.stringify(nagadURLdata));
                let nagadURL=nagadURLdata['callBackUrl'];
                let paymentReferenceId=nagadURLdata['confirmArgs']['paymentReferenceId'];
                //=================gateway response insert into db===============
                let bankrrobject = new Object();

                bankrrobject.transactionId = paymentId;
                bankrrobject.requsetData= dataconfig;
                bankrrobject.responseData=nagadURLdata['confirmArgs'];
                bankrrobject.additionalProperties=nagadURLdata;
                bankrequestrosponseadd.createLog(bankrrobject);
                //=================================================================
                if(nagadURL!==''){
                    log.debug.debug(
                        'Nagad Pay Gateway Index API:'+'\n'+
                        'order_id: '+ orderId + '\n'+
                        'checkout_url: '+ nagadURL + '\n'+
                        'paymentReferenceId: '+ paymentReferenceId + '\n'+
                        'Request Body: ' + JSON.stringify(dataconfig) + '\n'+
                        'Response Body: '+ JSON.stringify(nagadURLdata)
                    );
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.PENDING,
                        gatewayTransactionId:orderId,
                        referencePaymentId:paymentReferenceId,
                        id:paymentInfo[0].dataValues.id
                    });

                    return nagadURL;
                }
                else {
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
                    gatewayTransactionId: data.order_id
                });
                log.debug.debug(
                    'Nagad Gateway success call\n'+
                    'paymentId: ' + data.order_id +'\n'+
                    'Request data: ' + JSON.stringify(data)
                );
                if(!paymentInfo.length) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }
                if(paymentInfo[0].dataValues.paymentStatus == TRX_STATUS.SUCCESS) {
                   throw new AppError(appCodes.PAYMENT_TRANSACTION_SUCCESS);
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });

                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });
                //============payment verification==========================
                var fs1 =require("fs");
                var configdata = {
                    apiVersion: 'v-0.2.0',
                    baseURL: gatewayInfo[0].dataValues.additionalProperties.BaseURL,
                    callbackURL: gatewayInfo[0].dataValues.baseUrl+'/api/nagad/success/',
                    merchantID: merchantInfo[0].dataValues.additionalProperties.BankMerchantId,
                    merchantNumber:merchantInfo[0].dataValues.additionalProperties.accountNumber,
                    privKey:  merchantInfo[0].dataValues.additionalProperties.private_key,
                    pubKey:  merchantInfo[0].dataValues.additionalProperties.public_key,
                };

                const nagad = new NagadGateway(configdata);

                const verifynagaddata = await nagad.verifyPayment(data.payment_ref_id);

                const gwstatus=verifynagaddata['status'];
                const gwstatusCode=verifynagaddata['statusCode'];
                log.debug.debug(
                    'Nagad Gateway success Status:\n'+
                    'paymentId: ' + data.order_id +'\n'+
                    'Response data: ' + verifynagaddata
                );

                //======================db log================
                let bankrrobject = new Object();
                bankrrobject.transactionId = paymentInfo[0].dataValues.transactionId;
                bankrrobject.requsetData= data.payment_ref_id;
                bankrrobject.responseData=verifynagaddata;
                bankrrobject.additionalProperties=data;

                bankrequestrosponseadd.createLog(bankrrobject);
                // =================================================
                if(verifynagaddata['statusCode']=='000'){
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.SUCCESS,
                        gatewayErrorCode:verifynagaddata['statusCode'],
                        gatewayErrorMsg:verifynagaddata['status'],
                        remarks:JSON.stringify(verifynagaddata),
                        id:paymentInfo[0].dataValues.id
                    });
                    var merchant_redirect_data=JSON.stringify({
                        'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                        'paymentId':paymentInfo[0].dataValues.transactionId,
                        'status':'success',
                        'msg':'Payment successful',
                        'txnAmount':verifynagaddata.amount,
                        'merchantTransactionId':paymentInfo[0].dataValues.merchantTransactionId,
                        'TxnResponse':'2',
                        'gateway':'NAGAD',
                        'bankauthorid':verifynagaddata.issuerPaymentRefNo,
                        'paymentnumber':verifynagaddata.clientMobileNo
                    });
                    var merchant_redirect_url=paymentInfo[0].additionalProperties.success_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment successful&TxnAmount='+paymentInfo[0].dataValues.amount+'&merchantTransactionId='+paymentInfo[0].dataValues.merchantTransactionId+'&txnResponse=2';
                }
                else{
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.FAILED,
                        gatewayErrorCode:verifynagaddata['statusCode'],
                        gatewayErrorMsg:verifynagaddata['status'],
                        remarks:JSON.stringify(verifynagaddata),
                        id:paymentInfo[0].dataValues.id
                    });
                    var merchant_redirect_data=JSON.stringify({
                        'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                        'paymentId':paymentInfo[0].dataValues.transactionId,
                        'status':'FAILED',
                        'msg':'Payment Failed',
                        'txnAmount':verifynagaddata.amount,
                        'merchantTransactionId':paymentInfo[0].dataValues.merchantTransactionId,
                        'txnResponse':'3'
                    });
                    var merchant_redirect_url=paymentInfo[0].additionalProperties.fail_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=failed&msg=Payment Failed&TxnAmount='+paymentInfo[0].dataValues.amount+'&merchantTransactionId='+paymentInfo[0].dataValues.merchantTransactionId+'&txnResponse=3';
                }
                //==================end=========================
                return merchant_redirect_url;
                // return merchantInfo[0].dataValues.callbackUrl + '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment successful'+ '&fosterid='+data.fosterid+'&TxnAmount='+data.TxnAmount+'&MerchantTxnNo='+data.MerchantTxnNo+'&OrderNo='+data.OrderNo+'&TxnResponse='+data.TxnResponse;
            }
            catch (e) {
                log.error.error(
                    'paymentId: '+ paymentInfo[0].dataValues.transactionId +
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
                    gatewayTransactionId: data.order_id
                });

                log.debug.debug(
                    'shurjopay Gateway success call\n'+
                    'paymentId: ' + data.order_id +'\n'+
                    'Request data: ' + JSON.stringify(data)
                );

                if(!paymentInfo.length) {
                    throw new AppError(appCodes.INVALID_PAYMENT_TRANSACTION);
                }
                if(paymentInfo[0].dataValues.paymentStatus == TRX_STATUS.SUCCESS) {
                    throw new AppError(appCodes.PAYMENT_TRANSACTION_SUCCESS);
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
                    id:paymentInfo[0].dataValues.id
                });
                var merchant_redirect_date=JSON.stringify({
                    'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                    'paymentId':paymentInfo[0].dataValues.transactionId,
                    'status':'FAILED',
                    'msg':'Payment Failed',
                    'TxnAmount':"",
                    'MerchantTxnNo':paymentInfo[0].additionalProperties.mcnt_TxnNo,
                    'TxnResponse':'3',
                    'OrderNo':paymentInfo[0].additionalProperties.mcnt_OrderNo
                });
                //return merchantInfo[0].dataValues.callbackUrl + '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=failed&msg=Payment fail';
                //  var merchant_redirect_url=paymentInfo[0].additionalProperties.fail_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment Failed&TxnAmount='+paymentrequestresponsedata.data[0].amount+'&MerchantTxnNo='+paymentInfo[0].additionalProperties.mcnt_TxnNo+'&TxnResponse=3';
                return merchant_redirect_date;
            }
            catch (e) {
                
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
                    'Central Payment Gateway cancel call\n'+
                    'paymentId: ' + data.MerchantTxnNo +'\n'+
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