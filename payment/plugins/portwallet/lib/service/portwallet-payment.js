'use strict';

const config = require('../../../../config').redis;
const axios = require('axios');
const FormData = require('form-data');

module.exports = async () => {

    var GwBaseUrl = '',token_url="",verification_url='',payment_request_url='';

    function prepareUrl (baseUrl,actionUrl) {
        return baseUrl+'/'+actionUrl;
    }

    return {
        async createPayment(context) {
            try {
                GwBaseUrl = context.gatewayInfo.paymentrequestBaseUrl;
                let bodyData = new FormData();
                const postData = context.data;

                for (const property in postData) {
                    bodyData.append(property, postData[property]);
                }
                return await axios({
                    url: prepareUrl(GwBaseUrl,createPaymnetEndPoint),
                    method: 'post',
                    // headers: bodyData.getHeaders(),
                    data: JSON.stringify(postData)
                });

            } catch (e) {
                throw new Error(e.message);
            } 
        },
        async lookup(context) {
            try {
                let url = prepareUrl(GwBaseUrl,lookupEndPoint);

                return axios.get(url,{
                    params:context
                });
            } catch (e) {
                throw new Error(e.message);
            }
        },
        async lookupsubscription(context,url) {
            try {
                let bodyData = new FormData();
                const postData = context.data;
                for (const property in postData) {
                    bodyData.append(property, postData[property]);
                }
                return await axios({
                    url:url,
                    method: 'post',
                    headers: bodyData.getHeadersjson(),
                    data: JSON.stringify(context)
                });
            } catch (e) {
                throw new Error(e.message);
            }
        }
    }
}