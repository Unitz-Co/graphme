const _ = require('lodash');

function Container() {
  const models = {};
  const modelDefs = {};
  const modelConstDefs = new Map();

  const container = {
    register(name, Model) {
      _.set(models, name, Model);
    },
    resolve(name) {
      if(_.isString(name)) {
        return _.get(models, name);
      }
      return name;
    },

    registerDefinition(name, Model, definition) {

      _.set(modelDefs, name, definition);

      modelConstDefs.set(Model, definition);

    },
    resolveDefinition(name) {
      if(_.isString(name)) {
        return _.get(modelDefs, name);
      } else if(modelConstDefs.has(name)) {
        // use model constructor as name
        return modelConstDefs.get(name);
      } else if(_.has(name, 'DEFINITION')) {
        return _.get(name, 'DEFINITION');
      }
      return name;
    }  
  };
  return container;
}

module.exports = Container();
