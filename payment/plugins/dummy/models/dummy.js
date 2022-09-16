'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Test', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'dummy_test',
    timestamps: false
  });
};