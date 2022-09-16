'use strict';

const fs = require('fs');
const { join } = require('path');
const { EOL } = require('os');

const BASE_PATH = './plugins';

module.exports = () => {
  return {
    addPlugin(properties) {
      if (!properties) return;

      const { name, contents } = properties;
      const pluginPath = join(BASE_PATH, name);
      fs.mkdirSync(pluginPath);

      const pluginIndexPath = join(pluginPath, 'index.js');
      fs.writeFileSync(pluginIndexPath, contents.join(EOL));
    },
    removePlugin(properties) {
      if (!properties) return;

      const { name } = properties;

      const pluginPath = join(BASE_PATH, name);
      const pluginIndexPath = join(pluginPath, 'index.js');

      fs.unlinkSync(pluginIndexPath);
      fs.rmdirSync(pluginPath);
    },
    createDirectory(path) {
      fs.mkdirSync(path);
    },
    createFile(path, fileName, fileContent){
      if(fs.existsSync(path+'/'+fileName)){
        fs.unlinkSync(path+'/'+fileName)
      }

      fs.writeFileSync(path+'/'+fileName,fileContent);
    },
    deleteDirectory(path) {
      if(fs.existsSync(path)){
        fs.readdirSync(path).forEach(file => {
          fs.unlinkSync(path+'/'+file)
        });
        fs.rmdirSync(path)
      }
    }
  }
};
