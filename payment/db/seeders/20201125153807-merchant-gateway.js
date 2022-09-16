'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const MERCHANT_GATEWAY = queryInterface.sequelize.options.define.tables.MerchantGateway;
    return queryInterface.bulkInsert(MERCHANT_GATEWAY, [{
      id: 1,
      merchant_id: '1',
      gateway_id: '1',
      callback_url: 'http://localhost',
      created_by: 'admin',
      created_at: Sequelize.fn('now')
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    const MERCHANT_GATEWAY = queryInterface.sequelize.options.define.tables.MerchantGateway;
    return queryInterface.bulkDelete(
        MERCHANT_GATEWAY,
        {
          id: {[Sequelize.Op.in]: [1]}
        },
        {}
    );
  }
};
