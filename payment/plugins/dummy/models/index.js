'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (db) => {
  const models = {};
  const sequelize = db.sequelize;
  const basename = path.basename(__filename);

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = sequelize['import'](path.join(__dirname, file));
      models[model.name] = model;
    });

  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
};