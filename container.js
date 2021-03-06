const _ = require('lodash');

function Container() {
  models = {};
  modelDefs = {};
  modelConstDefs = new Map();

  const container = {
    register(name, schema) {
      _.set(models, name, schema);
    },
    resolve(name) {
      if(_.isString(name)) {
        return _.get(models, name);
      }
      return name;
    },

    registerDeffinition(name, schema, definition) {

      _.set(modelDefs, name, definition);

      modelConstDefs.set(schema, definition);  

    },
    resolveDefinition(name) {
      if(_.isString(name)) {
        return _.get(modelDefs, name);
      } else if(modelConstDefs.has(name)) {
        // use model constructor as name
        return modelConstDefs.get(name);
      }
      return name;
    }  
  };
  return container;
}

module.exports = Container();
