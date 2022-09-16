'use strict';

const {TRX_STATUS} = require('../../../../lib/constants');
const appCodes = require('../../../../lib/app-codes');
const AppError = require('../../../../lib/app-error').AppError;

const log = require('../../../../lib/log');
const deccryption = require('../../../../lib/crypto');
const bankrequestrosponseadd = require('../../../../lib/gateway-req-res-log')();

const NagadGateway = require('../../../../node_modules/nagad-payment-gateway');

module.exports = async (service) => {

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
                if(paymentInfo[0].dataValues.additionalProperties.GW!=='PORTWALLET'|| paymentInfo[0].dataValues.additionalProperties.CardType!=='PORTWALLET'){
                    throw new AppError(appCodes.INVALID_PAYMENT_REQUEST_PARAMETER);
                }
                const gatewayInfo = await service.fetchGatewayInfo({
                    id: paymentInfo[0].dataValues.gatewayId
                });
                const merchantInfo = await service.fetchMerchantInfo({
                    merchantId: paymentInfo[0].dataValues.merchantId,
                    gatewayId: paymentInfo[0].dataValues.gatewayId
                });


                let cust_CustomerContact=paymentInfo[0].dataValues.additionalProperties.cust_CustomerContact;
                let cust_CustomerGender=paymentInfo[0].dataValues.additionalProperties.cust_CustomerGender;
                let cust_CustomerCity=paymentInfo[0].dataValues.additionalProperties.cust_CustomerCity;
                let cust_CustomerState=paymentInfo[0].dataValues.additionalProperties.cust_CustomerState;
                let cust_CustomerPostcode=paymentInfo[0].dataValues.additionalProperties.cust_CustomerPostcode;
                let cust_CustomerCountry=paymentInfo[0].dataValues.additionalProperties.cust_CustomerCountry;
                let cust_CustomerServiceName=paymentInfo[0].dataValues.additionalProperties.cust_CustomerServiceName;
                let shippingaddress1=paymentInfo[0].dataValues.additionalProperties.cust_ShippingAddress;
                let cust_orderitems=paymentInfo[0].dataValues.additionalProperties.cust_orderitems;
                let cust_CustomerAddress=paymentInfo[0].dataValues.additionalProperties.cust_CustomerAddress;
                let OrderNo=paymentInfo[0].dataValues.additionalProperties.mcnt_OrderNo;

                if(cust_CustomerCity==''||cust_CustomerAddress==''){cust_CustomerCity='Dhaka'; cust_CustomerAddress="Bangladesh";}
                if(cust_CustomerCountry==''||cust_CustomerCountry=='N/A'){cust_CustomerCountry='Bangladesh';}
                if(cust_CustomerPostcode==''||cust_CustomerPostcode=='0'||cust_CustomerPostcode=='NA'||cust_CustomerPostcode=='n/a'||cust_CustomerPostcode=='N/A'){cust_CustomerPostcode='1212';}
                if(cust_CustomerState==''||cust_CustomerState=='N/A'){cust_CustomerState='Dhaka';}
                if(cust_orderitems==''||cust_orderitems=='1'){cust_orderitems=cust_CustomerServiceName;}

                var md5 = require('md5');
                let time=Math.floor(Date.now() / 1000);

                var md5hash = md5(merchantInfo[0].dataValues.additionalProperties.SecretKey+time);
                let basedata=merchantInfo[0].dataValues.additionalProperties.appkey +':'+md5hash;

                let idtoken=Buffer.from(basedata).toString('base64');
                const TxnAmount = parseFloat(Number(paymentInfo[0].dataValues.amount).toFixed(2));

                const orderdetails={
                    amount:TxnAmount,
                    currency:paymentInfo[0].dataValues.additionalProperties.mcnt_Currency,
                    redirect_url:gatewayInfo[0].dataValues.baseUrl+'/api/portwallet/success/',
                    ipn_url:'https://demo-cashier.dotlines.com.bd/payments/gateway/portwallet/responsereceiveripn.php',
                    reference:OrderNo
                };
                const product={
                    name:cust_CustomerServiceName,
                    description:cust_orderitems
                };
                const billingaddress={
                    street:cust_CustomerServiceName,
                    city:cust_CustomerCity,
                    state:cust_CustomerState,
                    zipcode:cust_CustomerPostcode,
                    country:'BD'
                };
                const billingcustomer={
                    name:paymentInfo[0].dataValues.additionalProperties.cust_CustomerName,
                    email:paymentInfo[0].dataValues.additionalProperties.cust_CustomerEmail,
                    phone:paymentInfo[0].dataValues.additionalProperties.cust_CustomerContact,
                    address:billingaddress
                };
                const billing={
                    customer:billingcustomer
                };
                const shipping={
                    customer:billingcustomer
                };
                let apiResponse = new Object();
                apiResponse.order = orderdetails;
                apiResponse.product = product;
                apiResponse.billing = billing;
                apiResponse.shipping = shipping;

                if(paymentInfo[0].dataValues.additionalProperties.mcnt_ShortName=='FosterTest'){
                    const default_network=[{
                        default_network:'bkashcheckout'
                    }];
                    apiResponse.customs = default_network;
                }

                // console.log("Sent to data Portwallet:"+JSON.stringify(apiResponse));

                var axios = require('axios');
                var qs = require('qs');
                // var tokendata = qs.stringify({apiResponse});
                var config = {
                    method: 'post',
                    url: gatewayInfo[0].dataValues.additionalProperties.payment_request_url,
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization':'Bearer '+ idtoken
                    },
                    data : apiResponse
                };
                // console.log('config:'+JSON.stringify(config));
                var tokenresponse=await axios(config);
                // console.log('tokenresponse:'+JSON.stringify(tokenresponse.data));

                //=================gateway response insert into db===============
                let bankrrobject = new Object();

                bankrrobject.transactionId = paymentId;
                bankrrobject.requsetData= apiResponse;
                bankrrobject.responseData=tokenresponse.data;
                // bankrrobject.additionalProperties=tokenresponse.data.invoice_id;
                bankrequestrosponseadd.createLog(bankrrobject);
                //=================================================================
                if(tokenresponse.data.url!==''){
                    log.debug.debug(
                        'Portwallet Pay Gateway Index API:'+'\n'+
                        'order_id: '+ paymentId + '\n'+
                        'checkout_url: '+ tokenresponse.data.data.action.url + '\n'+
                        'paymentReferenceId: '+ tokenresponse.data.data.invoice_id + '\n'+
                        'Request Body: ' + JSON.stringify(apiResponse) + '\n'+
                        'Response Body: '+ JSON.stringify(tokenresponse.data)
                    );
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.PENDING,
                        gatewayTransactionId:tokenresponse.data.data.invoice_id,
                        referencePaymentId:tokenresponse.data.data.invoice_id,
                        id:paymentInfo[0].dataValues.id
                    });
                    // console.log('config:'+JSON.stringify(tokenresponse.data.data.action.url));
                    return tokenresponse.data.data.action.url;
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
                    gatewayTransactionId: data.invoice
                });
                log.debug.debug(
                    'Portwallet Gateway success call\n'+
                    'paymentId: ' + paymentInfo[0].dataValues.transactionId +'\n'+
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
                // console.log("paymentInfo:"+JSON.stringify(paymentInfo));
                //============payment verification==========================
                var md5 = require('md5');
                let time=Math.floor(Date.now() / 1000);

                var md5hash = md5(merchantInfo[0].dataValues.additionalProperties.SecretKey+time);
                let basedata=merchantInfo[0].dataValues.additionalProperties.appkey +':'+md5hash;
                let idtoken=Buffer.from(basedata).toString('base64');

                var axios = require('axios');
                var qs = require('qs');
                var config = {
                    method: 'get',
                    url: gatewayInfo[0].dataValues.additionalProperties.payment_request_url+'/'+data.invoice,
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization':'Bearer '+ idtoken
                    },
                    data : ''
                };

                var tokenresponse=await axios(config);

                log.debug.debug(
                    'Nagad Gateway success Status:\n'+
                    'paymentId: ' + data.invoice +'\n'+
                    'Response data: ' + JSON.stringify(tokenresponse.data)
                );
                // console.log('bankauthorid:'+tokenresponse.data.data.billing.gateway.approval_code);
                //======================db log================
                let bankrrobject = new Object();
                bankrrobject.transactionId = paymentInfo[0].dataValues.transactionId;
                bankrrobject.requsetData= gatewayInfo[0].dataValues.additionalProperties.payment_request_url+'/'+data.invoice;
                bankrrobject.responseData=tokenresponse.data;
                bankrequestrosponseadd.createLog(bankrrobject);
                // =================================================
                if(tokenresponse.data.data.transactions.status=='ACCEPTED'){
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.SUCCESS,
                        gatewayErrorCode:tokenresponse.data.data.transactions.status,
                        gatewayErrorMsg:tokenresponse.data.data.transactions.status,
                        remarks:JSON.stringify(tokenresponse.data.data),
                        id:paymentInfo[0].dataValues.id
                    });
                    var merchant_redirect_data=JSON.stringify({
                        'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                        'paymentId':paymentInfo[0].dataValues.transactionId,
                        'status':'success',
                        'msg':'Payment successful',
                        'TxnAmount':tokenresponse.data.data.transactions.amount,
                        'MerchantTxnNo':paymentInfo[0].additionalProperties.mcnt_TxnNo,
                        'TxnResponse':'2',
                        'OrderNo':paymentInfo[0].additionalProperties.mcnt_OrderNo,
                        'gateway':'PORTWALLET',
                        'bankauthorid':tokenresponse.data.data.billing.gateway.approval_code,
                        'paymentnumber':tokenresponse.data.data.billing.source.number
                    });
                    var merchant_redirect_url=paymentInfo[0].additionalProperties.success_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=success&msg=Payment successful&TxnAmount='+paymentInfo[0].dataValues.amount+'&MerchantTxnNo='+paymentInfo[0].additionalProperties.mcnt_TxnNo+'&TxnResponse=2';
                }
                else{
                    await service.updatePayment({
                        paymentStatus: TRX_STATUS.FAILED,
                        gatewayErrorCode:tokenresponse.data.data.transactions.status,
                        gatewayErrorMsg:tokenresponse.data.data.billing.gateway.reason,
                        remarks:JSON.stringify(tokenresponse.data.data),
                        id:paymentInfo[0].dataValues.id
                    });
                    var merchant_redirect_data=JSON.stringify({
                        'merchant_redirect_url':paymentInfo[0].additionalProperties.success_url,
                        'paymentId':paymentInfo[0].dataValues.transactionId,
                        'status':'FAILED',
                        'msg':'Payment Failed',
                        'TxnAmount':tokenresponse.data.data.transactions.amount,
                        'MerchantTxnNo':paymentInfo[0].additionalProperties.mcnt_TxnNo,
                        'TxnResponse':'3',
                        'OrderNo':paymentInfo[0].additionalProperties.mcnt_OrderNo
                    });
                    console.log('merchant_redirect_url:'+merchant_redirect_url);
                    var merchant_redirect_url=paymentInfo[0].additionalProperties.fail_url+ '?' + 'paymentId='+ paymentInfo[0].dataValues.transactionId + '&status=failed&msg=Payment Failed&TxnAmount='+paymentInfo[0].dataValues.amount+'&MerchantTxnNo='+paymentInfo[0].additionalProperties.mcnt_TxnNo+'&TxnResponse=3';
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