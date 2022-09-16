'use strict';

const config = require('../../../../config').redis;
const axios = require('axios');
const FormData = require('form-data');

module.exports = async () => {

    var coderoGwBaseUrl = '';
    const createPaymnetEndPoint = 'payment/request.php';
    const lookupEndPoint = 'api/v1/trxcheck/request.php';

    function prepareUrl (baseUrl,actionUrl) {
        return baseUrl+'/'+actionUrl;
    }

    return {
        async createPayment(context) {
            try {
                coderoGwBaseUrl = context.gatewayInfo.coderoBaseUrl;

                let bodyData = new FormData();
                const postData = context.data;

                for (const property in postData) {
                    bodyData.append(property, postData[property]);
                }
                
                return await axios({
                    url: prepareUrl(coderoGwBaseUrl,createPaymnetEndPoint),
                    method: 'post',
                    headers: bodyData.getHeaders(),
                    data: bodyData
                });

            } catch (e) {
                
                throw new Error(e.message);
            } 
        },
        async lookup(context) {
            try {
                let url = prepareUrl(coderoGwBaseUrl,lookupEndPoint);

                return axios.get(url,{
                    params:context
                });
            } catch (e) {
                throw new Error(e.message);
            }
        }
    }
}