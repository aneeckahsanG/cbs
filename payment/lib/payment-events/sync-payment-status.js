'use strict';

const {ACTIVE, TRX_STATUS, EVENT_TYPE, EVENT_STATE} = require('../constants');

module.exports = ({
  db, pluginManager, paymentTransactionController, gatewayController, merchantGatewayController
}) => {
  const GET_PAYMENT_INFO_METHOD = 'getPaymentInfo';
  const gateways = {};
  const merchants = {};

  async function fetchEvents(limit) {
    return await db['PaymentTransactionEvent']
      .findAll({
        where: {
          eventType: {
            [db.Sequelize.Op.eq]: EVENT_TYPE.SYNC_STATUS
          },
          eventState: {
            [db.Sequelize.Op.ne]: EVENT_STATE.DONE
          },
          processingAt: {
            [db.Sequelize.Op.lte]: db.Sequelize.literal('NOW()')
          }
        },
        limit: limit
      }).then((events) => {
        return events.map(event => event.dataValues);
      }).catch((_) => { return []; });
  }

  async function updateEvent(event) {
    await db['PaymentTransactionEvent']
      .update(event, {
        where: {
          id: {
            [db.Sequelize.Op.eq]: event.id
          },
          eventState: {
            [db.Sequelize.Op.ne]: EVENT_STATE.DONE
          }
        }
      }).catch((_) => {});
  }

  async function createEvent(event) {
    event.processingAt = new Date();
    event.createdAt = new Date();

    await db['PaymentTransactionEvent']
      .create(event)
      .catch((_) => {});
  }

  function gatewaySpecificIntervals(gateway, defaultIntervals) {
    if (gateway.additionalProperties && gateway.additionalProperties.checkIntervals) {
      return Array.isArray(gateway.additionalProperties.checkIntervals) ?
        gateway.additionalProperties.checkIntervals :
        [gateway.additionalProperties.checkIntervals];
    }

    return defaultIntervals;
  }

  function gatewaySpecificMaxRetry(gateway, defaultMaxRetry) {
    if (gateway.additionalProperties && gateway.additionalProperties.maxRetry) {
      return gateway.additionalProperties.maxRetry;
    }

    return defaultMaxRetry;
  }

  async function keepInProcessingState({event, remarks, checkIntervals}) {
    const retryCounter = event.retryCounter + 1;
    const nextInterval = (checkIntervals.length < retryCounter) ?
      checkIntervals[checkIntervals.length - 1] : checkIntervals[retryCounter];

    await updateEvent({
      id: event.id,
      eventState: EVENT_STATE.PROCESSING,
      remarks: remarks || 'System yet to determine terminal state',
      retryCounter: db.Sequelize.literal('retry_counter + 1'),
      processingAt: db.Sequelize.literal(`DATE_ADD(NOW(), INTERVAL ${nextInterval} SECOND)`)
    });
  }

  async function moveTransactionInFailedState({eventData, event, remarks}) {
    await paymentTransactionController.updatePaymentTransactionForSync({
      id: eventData.id,
      paymentStatus: TRX_STATUS.UNKNOWN,
      remarks: 'System can not determine Payment\'s terminal state',
      retryCounter: db.Sequelize.literal('retry_counter + 1')
    });

    await updateEvent({
      id: event.id,
      eventState: EVENT_STATE.DONE,
      remarks: remarks || 'System can not determine Payment\'s terminal state',
      retryCounter: db.Sequelize.literal('retry_counter + 1'),
      processingAt: new Date()
    });
  }

  async function getMerchantCallbackUrl(eventData) {
    if (eventData.merchantCallbackUrl) return eventData.merchantCallbackUrl;
    if (merchants[eventData.merchantId] && merchants[eventData.merchantId][eventData.gatewayId]) {
      return merchants[eventData.merchantId][eventData.gatewayId].callbackUrl;
    }

    try {
      const merchantGateways = await merchantGatewayController.fetchMerchantGateway({
        merchantId: eventData.merchantId,
        gatewayId: eventData.gatewayId,
        status: ACTIVE
      });
      if (merchantGateways.length >= 1) {
        if (!merchants[eventData.merchantId]) merchants[eventData.merchantId] = {};
        merchants[eventData.merchantId][eventData.gatewayId] = Object.assign({}, merchantGateways[0]);
        return merchants[eventData.merchantId][eventData.gatewayId].callbackUrl;
      }
    } catch (_) {}

    return null;
  }

  return async ({checkIntervals, maxRetry, limit}) => {
    try {
      let events = await fetchEvents();
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (!event.eventData || !event.eventData.id || !event.eventData.gatewayId) {
          await updateEvent({
            id: event.id,
            eventState: EVENT_STATE.DONE,
            remarks: 'Malformed Event-Data',
            processingAt: new Date()
          });
          continue;
        }
        const eventData = event.eventData;

        if (!gateways[eventData.gatewayId]) {
          const paymentGateways = await gatewayController.fetchGateway({id: eventData.gatewayId, status: ACTIVE});
          if (paymentGateways.length > 0) {
            gateways[eventData.gatewayId] = Object.assign({}, paymentGateways[0]);
          }
        }

        if (!gateways[eventData.gatewayId]) {
          if ((event.retryCounter + 1) < maxRetry) {
            await keepInProcessingState({event, remarks: 'Invalid Gateway-Id', checkIntervals});
          }
          if ((event.retryCounter + 1) >= maxRetry) {
            await moveTransactionInFailedState({eventData, event, remarks: 'Invalid Gateway-Id'});
          }
          continue;
        }

        checkIntervals = gatewaySpecificIntervals(gateways[eventData.gatewayId], checkIntervals);
        maxRetry = gatewaySpecificMaxRetry(gateways[eventData.gatewayId], maxRetry);

        let done = false;
        let createNotifyEvent = true;
        let remarks;

        let plugin;
        try {
          plugin = await pluginManager.getOrLoad(gateways[eventData.gatewayId].name);
        } catch (e) {
          remarks = e.message || e.description;
        }

        if (plugin && plugin[GET_PAYMENT_INFO_METHOD]) {
          try {
            const ret = await plugin[GET_PAYMENT_INFO_METHOD](eventData);
            done = (ret.response.paymentStatus === TRX_STATUS.SUCCESS ||
              ret.response.paymentStatus === TRX_STATUS.FAILED);
            if (done) Object.assign(eventData, ret.response);
            const update = Object.assign({id: eventData.id}, ret.response);
            const affectedRows = await paymentTransactionController.updatePaymentTransactionForSync(update);
            if (affectedRows <= 0) {
              done = true;
              createNotifyEvent = false;
            }
          } catch (e) {
            done = false;
            remarks = e.message || e.description;
          }
        }

        if (done) {
          await updateEvent({
            id: event.id,
            eventState: EVENT_STATE.DONE,
            remarks: 'Payment-Status is in Terminal/Unknown State',
            retryCounter: db.Sequelize.literal('retry_counter + 1'),
            processingAt: new Date()
          });

          if (createNotifyEvent) {
            const merchantCallbackUrl = await getMerchantCallbackUrl(eventData);
            if (merchantCallbackUrl) {
              eventData.merchantCallbackUrl = merchantCallbackUrl;
              await createEvent({
                eventType: EVENT_TYPE.NOTIFY,
                eventData: eventData
              });
            }
          }
        }

        if (!done && ((event.retryCounter + 1) < maxRetry)) {
          await keepInProcessingState({event, remarks, checkIntervals});
        }

        if (!done && ((event.retryCounter + 1) >= maxRetry)) {
          await moveTransactionInFailedState({eventData, event, remarks});
        }
      }
    } catch (e) {
      // Log the error!
    }
  }
};
