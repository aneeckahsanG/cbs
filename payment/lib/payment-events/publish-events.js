'use strict';

module.exports = (db) => {
  return {
    async publish(paymentEvent) {
      paymentEvent.createdAt = new Date();
      paymentEvent.processingAt || (paymentEvent.processingAt = new Date());

      await db['PaymentTransactionEvent']
        .create(paymentEvent)
        .catch((_) => {});
    }
  };
};