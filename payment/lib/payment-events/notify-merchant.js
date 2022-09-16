'use strict';

const axios = require('axios');

const commUtils = require('../utils/common-functions');
const {SUCCESS} = require('../app-codes');
const {EVENT_TYPE, EVENT_STATE} = require('../constants');

module.exports = (db) => {

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

  async function fetchEvents(limit) {
    return await db['PaymentTransactionEvent']
      .findAll({
        where: {
          eventType: {
            [db.Sequelize.Op.eq]: EVENT_TYPE.NOTIFY
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

  return async ({nextInterval, maxRetry, limit}) => {
    try {
      const events = await fetchEvents(limit);

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (!event.eventData || !event.eventData.merchantCallbackUrl) {
          await updateEvent({
            id: event.id,
            eventState: EVENT_STATE.DONE,
            remarks: 'Malformed Event-Data'
          });
          continue;
        }

        let done = false;
        let remarks = 'Sent Notification';
        const eventId = event.id;
        delete event.id;

        await axios({
          url: event.eventData.merchantCallbackUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'post',
          data: event.eventData
        }).then(response => {
          done = response && response.data &&
            (Number(response.data.status) === SUCCESS.httpCode ||
              !commUtils.toBoolean(response.data.resend));
          if (!done) remarks = 'Merchant callback response error';
        }).catch(e => {
          remarks = e.message;
        });

        if (done || ((event.retryCounter + 1) >= maxRetry)) {
          await updateEvent({
            id: eventId,
            eventState: EVENT_STATE.DONE,
            remarks: remarks,
            retryCounter: db.Sequelize.literal('retry_counter + 1'),
            processingAt: new Date()
          });
        }

        if (!done && ((event.retryCounter + 1) < maxRetry)) {
          await updateEvent({
            id: eventId,
            eventState: EVENT_STATE.PROCESSING,
            remarks: remarks,
            retryCounter: db.Sequelize.literal('retry_counter + 1'),
            processingAt: db.Sequelize.literal(`DATE_ADD(NOW(), INTERVAL ${nextInterval} SECOND)`)
          });
        }
      }
    } catch (e) {
      // Log the error!
    }
  };
};