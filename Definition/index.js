const _ = require('lodash');
const { GqlBuilder } = require('@unitz/gqlbuilder');
const container = require('../container');

const BaseModel = require('../BaseModel');

const isDocument = (val) => {
  return val && _.get(val, 'kind') === 'Document';
};

const isField = (val) => {
  return [String, Number, Date, Boolean].includes(val);
};

const deDuplicateNode = (nodes) => {
  const len = nodes.length;
  const nameMap = {};
  for (let index = 0; index < len; index++) {
    const node = nodes.shift();
    if (!nameMap[node[0]]) {
      nodes.push(node);
    }
    nameMap[node[0]] = true;
  }
};

class Definition {
  name = '';

  schema = {
    count: Number,
  };

  GQL_ACTIONS = {};

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

  addField(fieldConfig) {
    const [fieldName, fieldType] = fieldConfig;
    _.set(this.definition.schema, fieldName, fieldType);
    return this;
  }

  getNodes() {
    // before getting, normalize the nodes defifition
    this.normalizeModelNodes();
    return _.get(this.definition, 'nodes', []);
  }

  addNode(nodeConfig) {
    const nodes = _.get(this.definition, 'nodes', []);
    const [nodeName] = nodeConfig;
    const found = _.find(nodes, ([name]) => name === nodeName);
    if (!found) {
      nodes.push(nodeConfig);
    }
    return this;
  }

  isNode(key) {
    return !!_.find(this.getNodes(), ([nodeName]) => nodeName === key);
  }

  isField(key) {
    return !!_.find(this.getFields(), key);
  }

  getNodeConfig(nodeName, configKey = '', defVal) {
    const found = _.find(this.getNodes(), ([itemName]) => itemName === nodeName);
    const foundConfig = _.last(found);
    return configKey ? _.get(foundConfig, configKey, defVal) : foundConfig;
  }

  getNodeModel(nodeName) {
    const found = _.find(this.getNodes(), ([itemName]) => itemName === nodeName);
    const nodeModel = _.get(found, '1');
    if (nodeModel) {
      return container.resolve(nodeModel);
    }
  }

  getKey() {
    return _.get(this.definition, 'key', 'id');
  }

  getKeys() {
    return _.compact([this.getKey(), ..._.get(this.definition, 'keys', [])]);
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
    if (!baseQuery) {
      throw Error('missing base query for the model definition');
    }

    if (_.isString(baseQuery)) {
      // try to load query instance via gqlbuilder instance
      baseQuery = GqlBuilder.loadDocument(baseQuery);
    } else if (isDocument(baseQuery)) {
      baseQuery = GqlBuilder.from(baseQuery);
    }

    if (!baseQuery.clone) {
      throw Error('Incorrect baseQuery for the model definition');
    }
    return baseQuery.clone();
  }

  getClient() {
    const getClient = _.get(this.definition, 'getClient');
    if (!getClient) {
      throw Error('Missing [getClient]  for the model definition');
    }
    return _.isFunction(getClient) ? getClient() : getClient;
  }

  getSelection() {
    if (_.has(this.definition, 'selection')) {
      return _.get(this.definition, 'selection', '');
    }
    const keys = this.getKeys();
    if (keys.length) {
      return `{${keys.join(' ,')}}`;
    }
  }

  addSelection(selection) {
    const escapseSelection = (val) => {
      const reg = /^\s*\{(.*)\}\s*$/g;
      const matches = reg.exec(`${val}`);
      if (matches) {
        return matches[1];
      }
      return val;
    };
    const currSelection = this.getSelection();
    if (currSelection) {
      const merged = GqlBuilder.utils.selections.merge(
        GqlBuilder.utils.selections.toAst(escapseSelection(currSelection)),
        GqlBuilder.utils.selections.toAst(escapseSelection(selection))
      );
      this.definition.selection = GqlBuilder.utils.selections.astToStr(merged);
    }
    return this;
  }

  with(propName, cb) {
    const propVal = _.get(this, propName);
    if (typeof propVal === 'function') {
      cb(propVal.call(this));
    } else if (_.has(this, propVal)) {
      cb(propVal);
    }
  }

  normalizeModelNodes = _.memoize(() => {
    const cacheImNodeMap = new Map();
    const createImNodeModel = (nodeDef) => {
      const [nodeName, nodeModel, nodeConfig] = nodeDef;
      const paths = _.toPath(nodeName);
      if (paths.length > 1) {
        const nodeModelClass = container.resolve(nodeModel);
        const nextNodeSelection = nodeModelClass && nodeModelClass.getSelection ? nodeModelClass.getSelection() : '';

        const rtn = _.reduceRight(
          paths.slice(0, -1),
          (nodeDefAcc, currLevel, index) => {
            const nextNodeSelection = nodeDefAcc.nextNodeSelection;
            const nextNodeConfig = nodeDefAcc.nodeConfig;
            const nextNodeModel = nodeDefAcc.nodeModel;

            const currPaths = paths.slice(0, index + 1);
            const currPathsKey = `path@${currPaths.join('_')}`;
            const nextLevel = paths[index + 1];
            const currNodeSelection = `{${nextLevel} ${nextNodeSelection}}`;

            // find existsing ImNodeModel and update its definitions
            if (cacheImNodeMap.has(currPathsKey)) {
              // reuse the InNodeModel
              const ImNodeModel = cacheImNodeMap.get(currPathsKey);
              if (isField(nextNodeModel)) {
                // update field
                ImNodeModel.getDefinition().addField([nextLevel, nextNodeModel]);
              } else {
                // update node
                ImNodeModel.getDefinition().addNode([nextLevel, nextNodeModel, nextNodeConfig]);
              }
              // update selection
              ImNodeModel.getDefinition().addSelection(currNodeSelection);

              return {
                nodeModel: ImNodeModel,
                nodeConfig: { usePlanSync: true },
                nextNodeSelection: currNodeSelection,
              };
            } else {
              const currNodeDef = {
                name: currLevel,
                ...(isField(nextNodeModel)
                  ? {
                      schema: { [nextLevel]: nextNodeModel },
                      nodes: [],
                    }
                  : {
                      schema: {},
                      nodes: [[nextLevel, nextNodeModel, nextNodeConfig]],
                    }),
                key: '',
                baseQuery: '',
                selection: currNodeSelection,

                GQL_ACTIONS: {
                  GET: currLevel,
                },
                getClient: this.definition.getClient,
              };

              class ImNodeModel extends BaseModel {
                static DEFINITION = Definition.create(currNodeDef);
              }

              cacheImNodeMap.set(currPathsKey, ImNodeModel);
              return {
                nodeModel: ImNodeModel,
                nodeConfig: { usePlanSync: true },
                nextNodeSelection: currNodeSelection,
              };
            }
          },
          {
            nodeModel,
            nodeConfig,
            nextNodeSelection,
          }
        );
        return [paths[0], rtn.nodeModel, rtn.nodeConfig];
      }

      return nodeDef;
    };

    const rtn = _.castArray(this.definition.nodes || []).map((nodeDef) => createImNodeModel(nodeDef));

    // remove duplicate nodes by name (index0)
    deDuplicateNode(rtn);

    this.definition.nodes = rtn;
    return rtn;
  });

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
