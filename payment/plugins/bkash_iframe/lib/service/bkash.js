'use strict';

const config = require('../../../../config').redis;
const axios = require('axios');

module.exports = async (context) => {
    
    const client = context['cache'].redisClient;
    
    var bKashGwBaseUrl = '';
    const createPaymnetEndPoint = 'checkout/payment/create';
    const executePaymnetEndPoint = 'checkout/payment/execute';
    const queryPaymentEndPoint = 'checkout/payment/query';
    const grantTokenEndPoint = 'checkout/token/grant';
    const refreshTokenEndPoint = 'checkout/token/refresh';

    const bKashCachePrefixAccessToken = 'bkash-access-token';
    const bKashCachePrefixRefreshToken = 'bkash-refresh-token';

    var accessToken = '';

    function prepareUrl (baseUrl,actionUrl) {
        return baseUrl+'/'+actionUrl;
    }

    function prepareCachePrefix(key,prefix) {
        return key + prefix;
    }

    async function setToken(key, value, expire) {
        client.selectAsync(config.db.bkash)
            .then(async (res) => {
                await client.setAsync(key, value, 'EX', expire);
            })
            .catch((error) => {
                throw error;
            });
    }



    async function createGrantToken(tokenInfo) {
        try {
            
            const params = {
                app_key: tokenInfo.properties.app_key,
                app_secret: tokenInfo.properties.app_secret
            };
    
            const headers = {
                "Content-Type":"application/json",
                "Accept": "application/json",
                "username": tokenInfo.properties.username,
                "password": tokenInfo.properties.password
            };
    
            return await axios({
                url: prepareUrl(bKashGwBaseUrl,grantTokenEndPoint),
                method: 'post',
                headers: headers,
                data: params
            });
        } catch (e) {
            throw error;
        }
    }

    async function createGrantTokenFromRefresh(tokenInfo, refreshToken) {
        try {
            const params = {
                app_key: tokenInfo.properties.app_key,
                app_secret: tokenInfo.properties.app_secret,
                refresh_token: refreshToken
            };
    
            const headers = {
                "Content-Type":"application/json",
                "Accept": "application/json",
                "username": tokenInfo.properties.username,
                "password": tokenInfo.properties.password
            };
    
            return await axios({
                url: prepareUrl(bKashGwBaseUrl,refreshTokenEndPoint),
                method: 'post',
                headers: headers,
                data: params
            });
        } catch (e) {
            throw error;
        }
    }

    async function getAccessToken(merchantInfo) {

        return client.selectAsync(config.db.bkash)
            .then(async (res) => {
                return await client.getAsync(prepareCachePrefix(merchantInfo.merchantId,bKashCachePrefixAccessToken));
            })
            .then(async (res) => {
                if(!res) {
                    const refreshToken = await client.getAsync(prepareCachePrefix(merchantInfo.merchantId,bKashCachePrefixRefreshToken));

                    if(!refreshToken) {
                        const info = await createGrantToken(merchantInfo);

                        await setToken(prepareCachePrefix(merchantInfo.merchantId,bKashCachePrefixAccessToken),info.data.id_token,info.data.expires_in);
                        await setToken(prepareCachePrefix(merchantInfo.merchantId,bKashCachePrefixRefreshToken),info.data.refresh_token,20*24*60*60);

                        return info.data.id_token
                    } else {

                        const token = await createGrantTokenFromRefresh(merchantInfo, refreshToken);
                        await setToken(prepareCachePrefix(merchantInfo.merchantId,bKashCachePrefixAccessToken),token.data.id_token,token.data.expires_in);

                        return token.data.id_token;

                    }
                }

                return res;
            })
            .catch((error) => {
                throw error;
            });
    }

    async function queryPayment(context) {
        try {
            bKashGwBaseUrl = context.gatewayInfo.bkashBaseUrl;
            const token = await getAccessToken(context.merchantInfo);

            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": token,
                "X-App-Key": context.merchantInfo.properties.app_key
            };

            return await axios({
                url: prepareUrl(bKashGwBaseUrl,queryPaymentEndPoint) + '/' + context.paymentId,
                method: 'post',
                headers: headers
            });

        } catch (e) {

            throw e;
        }
    }

    return {
        async createPayment(context) {
            try {
                const params = {
                    amount: parseFloat(context.amount).toFixed(2),
                    currency: context.currency,
                    intent: 'sale',
                    merchantInvoiceNumber: context.orderBookingId
                };
                bKashGwBaseUrl = context.gatewayInfo.bkashBaseUrl;
                const token = await getAccessToken(context.merchantInfo);

                const headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": token,
                    "X-App-Key": context.merchantInfo.properties.app_key
                };

                return await axios({
                    url: prepareUrl(bKashGwBaseUrl,createPaymnetEndPoint),
                    method: 'post',
                    headers: headers,
                    data: params
                });

            } catch (e) {
                throw e;
            } 
        },
        async executePayment(context) {
            try {
                bKashGwBaseUrl = context.gatewayInfo.bkashBaseUrl;
                const token = await getAccessToken(context.merchantInfo);

                const headers = {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": token,
                    "X-App-Key": context.merchantInfo.properties.app_key
                };

                return await axios({
                    url: prepareUrl(bKashGwBaseUrl,executePaymnetEndPoint) + '/' + context.paymentId,
                    method: 'post',
                    headers: headers,
                    timeout: 1000 * 30
                });
            } catch (e) {

                return await queryPayment(context);
            }
        }
    }
}