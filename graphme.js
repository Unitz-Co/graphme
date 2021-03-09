const _ = require('lodash');
const { GqlBuilder } = require('@uz/gqlbuilder');

const BaseModel = require('./BaseModel');
const Collection = require('./Collection');
const Definition = require('./Definition');
const container = require('./container');

const isValidDefinition = (definition) => {
  return ( true 
    && !!definition
  )
}
function GraphMe() {

  const instance = {
    model(name, schema) {
      if(_.isPlainObject(name)) {
        // support define model as {[name]: model} object
        return _.map(name, (val, key) => {
          return instance.model(key, val);
        });
      }
      if(!_.isString(name)) {
        throw Error(`Model must have name, receive "${name}" as name input`)
      }
      // validate model
      if(!BaseModel.isModelClass(schema)) {
        throw Error('Model must be a subsclass of graphme.BaseModel')
      }

      const definition = schema.DEFINITION;
      if(!isValidDefinition(definition)) {
        throw Error('invalid model definition');
      }

      // define collection type for each loaded model
      schema.Collection = function(...args) { return new Collection(schema, ...args); };
      schema.Collection.isCollection = true;
      // proxy some function from schema to schema.Collection
      schema.Collection.getSelection = schema.getSelection.bind(schema);

      container.register(name, schema);
      container.registerDeffinition(name, schema, definition);  
    },
    resolve: container.resolve,
    resolveDefinition: container.resolveDefinition,
    register: container.register,
    registerDeffinition: container.registerDeffinition,

    extends(name, handler) {
      instance[name] = handler;
    },

    BaseModel,
    Collection,
    Definition,
    GqlBuilder,
  }
  return instance;
}


const me = GraphMe();

module.exports = me;
