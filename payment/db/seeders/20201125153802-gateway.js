'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const GATEWAY = queryInterface.sequelize.options.define.tables.Gateway;
    return queryInterface.bulkInsert(GATEWAY, [{
      id: 1,
      name: 'dummy',
      pretty_name: 'Dummy Gateway',
      description: 'Dummy Gateway',
      base_url: 'http://localhost',
      additional_properties: '{"callbackUrl": "http://localhost:3000/webhook/notification", "checkIntervals": [3600]}',
      created_by: 'admin',
      created_at: Sequelize.fn('now')
    },{
      id: 2,
      name: 'cbs_accounting',
      pretty_name: 'cbs accounting',
      description: 'cbs accounting',
      base_url: 'http://localhost',
      additional_properties: '{"callbackUrl": "http://localhost:3000/webhook/notification", "checkIntervals": [3600]}',
      created_by: 'admin',
      created_at: Sequelize.fn('now')
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    const GATEWAY = queryInterface.sequelize.options.define.tables.Gateway;
    return queryInterface.bulkDelete(
        GATEWAY,
        {
          id: {[Sequelize.Op.in]: [1]}
        },
        {}
    );
  }
};
