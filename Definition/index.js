const _ = require('lodash');
const { GqlBuilder } = require('@unitz/gqlbuilder');
const container = require('../container');

class Definition {
  
  name = 'TransactionAggregateCount';

  schema = {
    count: Number,
  };

  GQL_ACTIONS = {
    GET: `aggregate`,
  };

  definition = {};
  
  constructor(definition) {
    this.definition = definition;
    // generate configures
    this.name = _.get(this.definition, 'name');
    this.schema = _.get(this.definition, 'schema');
    this.GQL_ACTIONS = _.get(this.definition, 'GQL_ACTIONS');
  }

  getFields() {
    return _.keys(this.definition.schema || {});
  }

  getNodes() {
    return _.get(this.definition, 'nodes', []);
  }

  isNode(key) {
    return !!_.find(this.getNodes(), ([nodeName]) => (nodeName === key));
  }
  
  isField(key) {
    return !!_.find(this.getFields(), key);
  }

  getNodeConfig(nodeName, configKey = '', defVal) {
    const found = _.find(this.getNodes(), ([itemName]) => (itemName === nodeName));
    const foundConfig = _.last(found);
    return (configKey ? _.get(foundConfig, configKey, defVal) : foundConfig);
  }

  getNodeModel(nodeName) {
    const found = _.find(this.getNodes(), ([itemName]) => (itemName === nodeName));
    const nodeModel = _.get(found, '1');
    if(nodeModel) {
      return container.resolve(nodeModel);
    }
  }

  getKey() {
    return _.get(this.definition, 'key', 'id');
  }

  getKeys() {
    return _.compact([
      this.getKey(),
      ..._.get(this.definition, 'keys', []),
    ]);
  }

  getForeignKeys() {
    return _.get(this.definition, 'foreignKeys', []);
  }

  getForeignKeysMapping() {
    return _.get(this.definition, 'foreignKeysMapping', {});
  }

  get_name() {
    return _.snakeCase(this.definition.name);
  }

  getName() {
    return _.snakeCase(this.definition.name);
  }

  getBaseQuery() {
    let baseQuery = _.get(this.definition, 'baseQuery');
    if(!baseQuery) {
      throw Error('missing base query for the model definition');
    }

    if(_.isString(baseQuery)) {
      // try to load query instance via gqlbuilder instance
      baseQuery = GqlBuilder.loadDocument(baseQuery);
    }

    if(!baseQuery.clone) {
      throw Error('Incorrect baseQuery for the model definition')
    }
    return baseQuery.clone();
  }

  getClient() {
    const getClient = _.get(this.definition, 'getClient');
    if(!getClient) {
      throw Error('Missing [getClient]  for the model definition');
    }
    return _.isFunction(getClient) ? getClient() : getClient;
  }

  getSelection() {
    if(_.has(this.definition, 'selection')) {
      return _.get(this.definition, 'selection', '');
    }
    const keys = this.getKeys();
    if(keys.length) {
      return `{${keys.join(' ,')}}`;
    }
  }

  static fromConfig(config) {
    // const Definition = this.constructor;
    return new Definition(config);
  }

  static create(config) {
    // const Definition = this.constructor;
    return new Definition(config);
  }
}

module.exports = Definition;
