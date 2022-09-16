const dbObj = require('../../db/models');
const dbOfDummy = require('../../plugins/dummy/models')(dbObj);
module.exports = async (db) => {
  if(!db) return;
	for(let i=0; i < db.length; i++){
    const model = db[i];
    for(let j = 0; j <model.data.length; j++){
      if(model.modelName==='Test'){
        await dbOfDummy[model.modelName].create(model.data[j]);
      }
      else{
        await dbObj[model.modelName].create(model.data[j]);
      }
    }
	}
}