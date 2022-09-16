'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

const log = require('../../../../lib/log');
const deccryption = require('../../../../lib/crypto');
// const bankrequestrosponseadd = require('../../../../lib/gateway-req-res-log')();
module.exports = async (service) => {
    const coderoApiService = await require('../service/shurjopay-payment')();

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
                if(paymentInfo[0].dataValues.additionalProperties.GW!=='SHURJOPAY'|| paymentInfo[0].dataValues.additionalProperties.CardType!=='SHURJOPAY'){
                    throw new AppError(appCodes.INVALID_PAYMENT_REQUEST_PARAMETER);
                }

                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });

                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });

                var axios = require('axios');
                var qs = require('qs');
                var tokendata = qs.stringify({
                    'username': merchantInfo[0].dataValues.additionalProperties.username,
                    'password': merchantInfo[0].dataValues.additionalProperties.password
                });

                var config = {
                    method: 'post',
                    url: gatewayInfo[0].dataValues.additionalProperties.token_url,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data : tokendata
                };

                var tokenresponse=await axios(config);
                // console.log(JSON.stringify(tokenresponse.data));
                if(tokenresponse.data.token!==''){
                    var requestdata = qs.stringify({
                        'token':tokenresponse.data.token,
                        'store_id':tokenresponse.data.store_id,
                        'prefix':merchantInfo[0].dataValues.additionalProperties.prefix,
                        'currency':paymentInfo[0].dataValues.additionalProperties.mcnt_Currency,
                        'return_url':gatewayInfo[0].dataValues.baseUrl+'/publicurl/api/shurjopay/success',
                        'cancel_url':gatewayInfo[0].dataValues.baseUrl+'/publicurl/api/shurjopay/fail',
                        'amount':paymentInfo[0].dataValues.additionalProperties.mcnt_Amount,
                        'order_id':paymentInfo[0].dataValues.transactionId,
                        'discsount_amount' :'0',
                        'disc_percent':'0',
                        'client_ip':'',
                        'customer_name':paymentInfo[0].dataValues.additionalProperties.cust_CustomerName,//M
                        'customer_phone':paymentInfo[0].dataValues.additionalProperties.cust_CustomerContact,//M
                        'customer_email':paymentInfo[0].dataValues.additionalProperties.cust_CustomerEmail,
                        'customer_address':paymentInfo[0].dataValues.additionalProperties.cust_CustomerAddress,//M
                        'customer_city':paymentInfo[0].dataValues.additionalProperties.cust_CustomerCity, //M
                        'customer_state':paymentInfo[0].dataValues.additionalProperties.cust_CustomerState,
                        'customer_postcode':paymentInfo[0].dataValues.additionalProperties.cust_CustomerPostcode,
                        'customer_country':paymentInfo[0].dataValues.additionalProperties.cust_CustomerCountry,
                        'value1':'',
                        'value2':'',
                        'value3' :'',
                        'value4':''
                    });
                    console.log(requestdata);
                    var requestdataconfig = {
                        method: 'post',
                        url: tokenresponse.data.execute_url,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data : requestdata
                    };

                    var paymentrequestresponsedata=await axios(requestdataconfig);
                    var sp_order_id=paymentrequestresponsedata.data.sp_order_id;
                    var checkout_url=paymentrequestresponsedata.data.checkout_url;

                    //=================gateway response insert into db===============
                    let bankrrobject = new Object();

                    bankrrobject.transactionId = paymentId;
                    bankrrobject.requsetData= paymentrequestresponsedata.data;
                    // bankrequestrosponseadd.createLog(bankrrobject);
                    //=================End===========================================
                }
                if(checkout_url!==''){
                    log.debug.debug(
                        'Shurjo Pay Gateway Index API:'+'\n'+
                        'sp_order_id: '+ sp_order_id + '\n'+
                        'checkout_url: '+ paymentrequestresponsedata.data.checkout_url + '\n'+
                        'Request Body: ' + JSON.stringify(paymentrequestresponsedata.data)
                    );
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.PENDING,
                        gatewayTransactionId:paymentrequestresponsedata.data.sp_order_id,
                        id:paymentInfo[0].dataValues.id
                    });

                    return checkout_url;
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
                // console.log(JSON.stringify(data));
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

                //============payment verification==========================
                var axios = require('axios');
                var qs = require('qs');
                var tokendata = qs.stringify({
                    'username': merchantInfo[0].dataValues.additionalProperties.username,
                    'password': merchantInfo[0].dataValues.additionalProperties.password
                });

                var config = {
                    method: 'post',
                    url: gatewayInfo[0].dataValues.additionalProperties.token_url,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data : tokendata
                };

                var tokenresponse=await axios(config);
                if(tokenresponse.data.token!==''){
                    var verificationdata = qs.stringify({
                        'order_id': data.order_id,
                        'token': tokenresponse.data.token
                    });

                    var verificationconfig = {
                        method: 'post',
                        url: gatewayInfo[0].dataValues.additionalProperties.verification_url,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data : verificationdata
                    };
                    var paymentrequestresponsedata=await axios(verificationconfig);
                    //=================gateway response update into db===============
                    let bankrrobject = new Object();

                    bankrrobject.transactionId = paymentInfo[0].dataValues.transactionId;
                    bankrrobject.responseData= paymentrequestresponsedata.data[0];
                    // console.log(JSON.stringify(bankrrobject));
                    // bankrequestrosponseadd.updateLog(bankrrobject);
                    //=================End===========================================

                    if(paymentrequestresponsedata.data[0].sp_code=='1000'){
                        await service.updatePayment({
                            paymentStatus: TRX_STATUS.SUCCESS,
                            referencePaymentId:paymentrequestresponsedata.data[0].bank_trx_id,
                            gatewayErrorCode:paymentrequestresponsedata.data[0].sp_code,
                            gatewayErrorMsg:paymentrequestresponsedata.data[0].sp_massage,
                            id:paymentInfo[0].dataValues.id
                        });
                        let date_ob = new Date();
                        let date = ("0" + date_ob.getDate()).slice(-2);
                        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                        let year = date_ob.getFullYear();

                        let hours = ("0" + date_ob.getHours()).slice(-2);;
                        let minutes = ("0" + date_ob.getMinutes()).slice(-2);
                        let seconds = ("0" + date_ob.getSeconds()).slice(-2);
                        let dt=year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

                        //subscription api
                        // if(paymentInfo[0].additionalProperties.isSubscription=='1' ){
                        //     const lookupRes = await coderoApiService.lookupsubscription({
                        //         userId: data.order_id,
                        //         productId:"1",
                        //         subscriptionPlanId: "1",
                        //         subscribeAt:dt,
                        //         renewAt: dt,
                        //         subChannel: paymentInfo[0].additionalProperties.mcnt_ShortName,
                        //         createdBy: paymentInfo[0].additionalProperties.mcnt_ShortName,
                        //         additionalProperties:{
                        //             gateway:"shurjopay",
                        //             bankauthorid:paymentrequestresponsedata.data[0].bank_trx_id,
                        //             paymentnumber:paymentrequestresponsedata.data[0].bank_trx_id,
                        //         }
                        //     },'http://45.249.101.186:7082/api/subscription');
                        //     console.log(JSON.stringify(lookupRes.data));
                        // }
                        //=====================end
                        var merchant_redirect_date=JSON.stringify({
                            'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                            'paymentId':paymentInfo[0].dataValues.transactionId,
                            'status':'success',
                            'msg':'Payment successful',
                            'TxnAmount':paymentrequestresponsedata.data[0].amount,
                            'MerchantTxnNo':paymentInfo[0].additionalProperties.mcnt_TxnNo,
                            'TxnResponse':'2',
                            'OrderNo':paymentInfo[0].additionalProperties.mcnt_OrderNo,
                            'isSubscription':paymentInfo[0].additionalProperties.isSubscription,
                            'gateway':'shurjopay',
                            'bankauthorid':paymentrequestresponsedata.data[0].bank_trx_id,
                            'paymentnumber':paymentrequestresponsedata.data[0].bank_trx_id
                        });
                        var merchant_redirect_url=paymentInfo[0].additionalProperties.success_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment successful&TxnAmount='+paymentrequestresponsedata.data[0].amount+'&MerchantTxnNo='+paymentInfo[0].additionalProperties.mcnt_TxnNo+'&TxnResponse=2';
                    }
                    else {
                        await service.updatePayment({
                            paymentStatus: TRX_STATUS.FAILED,
                            id:paymentInfo[0].dataValues.id
                        });
                        var merchant_redirect_date=JSON.stringify({
                            'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                            'paymentId':paymentInfo[0].dataValues.transactionId,
                            'status':'FAILED',
                            'msg':'Payment Failed',
                            'TxnAmount':paymentrequestresponsedata.data[0].amount,
                            'MerchantTxnNo':paymentInfo[0].additionalProperties.mcnt_TxnNo,
                            'TxnResponse':'3',
                            'OrderNo':paymentInfo[0].additionalProperties.mcnt_OrderNo
                        });
                        var merchant_redirect_url=paymentInfo[0].additionalProperties.fail_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=failed&msg=Payment Failed&TxnAmount='+paymentrequestresponsedata.data[0].amount+'&MerchantTxnNo='+paymentInfo[0].additionalProperties.mcnt_TxnNo+'&TxnResponse=3';
                    }
                }
                //==================end=========================
                // console.log(merchant_redirect_date);
                // return merchant_redirect_url;
                return merchant_redirect_date;
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