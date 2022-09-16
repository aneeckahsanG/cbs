const db = require('../../db/models');
module.exports = async () => {
	await db.Gateway.destroy({ truncate: true });
	await db.MerchantGateway.destroy({ truncate: true });
	await db.PaymentTransactionEvent.destroy({ truncate: true });
	await db.PaymentTransaction.destroy({ truncate: true });
}
