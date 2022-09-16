'use strict';

const axios = require('axios');

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

const ghooriStatus = {
  SUCCESS: 'CHARGED',
  FAILED: 'FAILED'
};

const TOKEN_REFRESH_THRESHOLD = 10;

module.exports = (gateway) => {
  const tokenInfo = {
    expireIn: 0,
    accessToken: null,
    refreshToken: null
  };

  async function fetchAccessToken() {
    const properties = gateway.additionalProperties;

    return await axios({
      url: `${gateway.baseUrl}/oauth/token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        grant_type: 'password',
        client_id: properties.clientId,
        client_secret : properties.clientSecret,
        username : properties.username,
        password : properties.password,
        scope: ''
      }
    }).then(response => {
      return {
        expireIn: response.data['expires_in'],
        accessToken: response.data['access_token'],
        refreshToken: response.data['refresh_token']
      }
    }).catch(err => {
      throw new Error(err.message);
    });
  }

  async function fetchRefreshToken(refreshToken) {
    const properties = gateway.additionalProperties;

    return await axios({
      url: `${gateway.baseUrl}/oauth/token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: properties.clientId,
        client_secret : properties.clientSecret,
        scope: ''
      }
    }).then(response => {
      return {
        expireIn: response.data['expires_in'],
        accessToken: response.data['access_token'],
        refreshToken: response.data['refresh_token']
      }
    }).catch(async (err) => {
      return await fetchAccessToken();
    });
  }

  async function fetchToken() {
    const epoch = Math.round(Date.now() / 100);
    if (tokenInfo.expireIn < epoch) {
      const ret = ((epoch - tokenInfo.expireIn) < TOKEN_REFRESH_THRESHOLD) && tokenInfo.refreshToken ?
        await fetchRefreshToken(tokenInfo.refreshToken) : await fetchAccessToken();
      Object.assign(tokenInfo, ret);
      tokenInfo.expireIn = (epoch + tokenInfo.expireIn - TOKEN_REFRESH_THRESHOLD);
    }

    return tokenInfo.accessToken;
  }

  return {
    'payment': async (request) => {
      const accessToken = await fetchToken();

      const data = {
        clientID: gateway.additionalProperties.clientId,
        orderID: request.transactionId,
        package: gateway.additionalProperties.package,
        amount: request.amount,
        callbackUrl: request['gatewayParams']['bKashRedirectUrl'],
        details: gateway.additionalProperties.package
      };
      if (request.accountId) {
        data['mobile'] = request.accountId;
      }

      return await axios({
        url: `${gateway.baseUrl}/api/v2.0/charge`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: data
      }).then(response => {
        if (response.data.errorCode !== '00') {
          return {
            op: op.CREATE,
            response: {
              accountId: request.accountId || 'NA',
              processedAmount: request.amount,
              processedCurrency: request.currency,
              paymentStatus: status.FAILED,
              gatewayErrorCode: response.data.errorCode,
              gatewayErrorMsg: response.data.errorMessage
            }
          }
        }

        return {
          op: op.CREATE,
          response: {
            accountId: request.accountId || 'NA',
            gatewayTransactionId: response.data.spTransID,
            processedAmount: request.amount,
            processedCurrency: request.currency,
            paymentStatus: status.INITIATED,
            redirectUrl: response.data.url
          }
        }
      }).catch(err => {
        throw new Error(err.message);
      });
    },
    'paymentCheck': async (paymentInfo) => {
      if (!['merchantTransactionId', 'amount', 'currency', 'gatewayParams'].every(
        field => paymentInfo[field] !== undefined
      )) {
        throw new ReferenceError('[merchantTransactionId, amount, currency, gatewayParams] required');
      }
      if (!['bKashRedirectUrl'].every(
        field => paymentInfo['gatewayParams'][field] !== undefined
      )) {
        throw new ReferenceError('[gatewayParams.bKashRedirectUrl] required');
      }
    },
    'parseNotification': async (req) => {
      return {
        response: {
          gatewayTransactionId: req.body.spTransId,
          accountId: req.body.bKashMsisdn,
          gatewayParams: {
            bKashTransID: req.body.bKashTransID
          },
          paymentStatus: status.SUCCESS
        }
      }
    },
    'replyNotification': async (req) => {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200,
        body: JSON.stringify({actionTaken: 'ACKNOWLEDGED'})
      }
    },
    // Fetch payment-transaction info
    'getPaymentInfo': async (req) => {
      const accessToken = await fetchToken();

      return await axios({
        url: `${gateway.baseUrl}/api/v2.0/status`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          clientID: req.transactionId,
          spTransID: req.gatewayTransactionId
        }
      }).then(response => {
        let processingStatus = status.PENDING;
        switch (response.data.status) {
          case ghooriStatus.SUCCESS:
            processingStatus = status.SUCCESS;
            break;
          case ghooriStatus.FAILED:
            processingStatus = status.FAILED;
            break;
          default:
            processingStatus = status.PENDING;
        }

        if (response.data.errorCode !== '00') {
          return {
            response: {
              paymentStatus: processingStatus,
              gatewayErrorCode: response.data.errorCode,
              gatewayErrorMsg: response.data.errorMessage
            }
          }
        }

        if (response.data.bKashTransID) {
          return {
            response: {
              gatewayParams: {
                bKashTransID: response.data.bKashTransID
              },
              paymentStatus: processingStatus
            }
          }
        }

        return {
          response: {
            paymentStatus: processingStatus
          }
        }
      }).catch(err => {
        throw new Error(err.message);
      });
    }
  };
};