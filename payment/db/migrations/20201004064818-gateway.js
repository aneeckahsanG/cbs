'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const GATEWAY = queryInterface.sequelize.options.define.tables.Gateway;
    return queryInterface.createTable(GATEWAY, {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      prettyName: {
        field: 'pretty_name',
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      baseUrl: {
        field: 'base_url',
        type: Sequelize.STRING,
        allowNull: false
      },
      additionalProperties: {
        field: 'additional_properties',
        type: Sequelize.JSON,
        allowNull: true
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.STRING,
        allowNull: false
      },
      updatedBy: {
        field: 'updated_by',
        type: Sequelize.STRING
      },
      createdAt: {
        field: 'created_at',
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE
      }
    }, {
      uniqueKeys: {
        name: {
          fields: [ 'name' ]
        }
      },
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    const GATEWAY = queryInterface.sequelize.options.define.tables.Gateway;
    return queryInterface.dropTable(GATEWAY);
  }
};
