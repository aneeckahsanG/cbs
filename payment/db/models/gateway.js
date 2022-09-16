'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Gateway', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prettyName: {
      field: 'pretty_name',
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    baseUrl: {
      field: 'base_url',
      type: DataTypes.STRING,
      allowNull: false
    },
    additionalProperties: {
      field: 'additional_properties',
      type: DataTypes.JSON,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING
    }
  }, {
    tableName: 'gateway'
  });
};