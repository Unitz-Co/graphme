const _ = require('lodash');

const Streamable = require('./Streamable');
const container = require('../container');
const define = require('../define');
const hooks = require('../hooks');
const Context = require('../context');
const SubscriptionMan = require('../SubscriptionMan');

class StreamableAndQueriable extends Streamable {
  props = {};
  state = {};

  constructor(props, ctx) {
    super();
    // init data if provided
    if(props) {
      this.set(props);
    }

    // create context chain
    const container = { context: new Context(ctx, { data: { type: 'Model'} }) };
    this.setContext = (ctx) => {
      container.context = ctx;
    }
    this.getContext = () => {
      return container.context;
    }
  }

  set(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];

        let target = this.props

        const def = this.getDefinition();
        if(def && def.isNode(key)) {
          target = this;
        }

        _.set(target, key, val);
        this.emit && this.emit('change', key, val);

      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(this.props, key, val);
      this.emit && this.emit('change', key, val);
      return this;
    }
  }

  has(key) {
    return _.has(this.props, key);
  }

  get(...args) {
    if(args.length === 0) {
      return this.props;
    }
    const [key, def] = args;
    return _.get(this.props, key, def);
  }

  pick(props) {
    const rtn = {};
    _.castArray(props || []).map(prop => {
      if(_.isArray(prop) && prop.length >= 2) {
        let [key, def, alias] = prop;
        alias = alias || key;
        if(this.has(key)) {
          rtn[alias] = this.get(key, def);
        }
      } else if(_.isString(prop)) {
        let key = prop;
        if(this.has(key)) {
          rtn[key] = this.get(key);
        }
      }
    });
    return rtn;
  }

  setState(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];
        _.set(this.state, key, val);
        this.emit && this.emit('changeState', key, val);
      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(this.state, key, val);
      this.emit && this.emit('changeState', key, val);
      return this;
    }
  }

  hasState(key) {
    return _.has(this.state, key);
  }

  getState(...args) {
    if(args.length === 0) {
      return this.state;
    }
    const [key, def] = args;
    return _.get(this.state, key, def);
  }

  pickState(props) {
    const rtn = {};
    _.castArray(props || []).map(prop => {
      if(_.isArray(prop) && prop.length >= 2) {
        let [key, def, alias] = prop;
        alias = alias || key;
        if(this.has(key)) {
          rtn[alias] = this.getState(key, def);
        }
      } else if(_.isString(prop)) {
        let key = prop;
        if(this.has(key)) {
          rtn[key] = this.getState(key);
        }
      }
    });
    return rtn;
  }

  async getByPath(path, def) {
    const paths = _.compact(_.toPath(path));
    if(!paths.length) return this;

    let curr = this;
    const size = paths.length - 1;
    for(let index = 0; index < paths.length; index++) {
      const level = paths[index];
      curr = await curr[level];
      if(!curr && (index < size))  {
        return def;
      }
    }
    return curr;
  }

  async setByPath(path, val) {
    const paths = _.compact(_.toPath(path));
    if(!paths.length) return this;

    const key = paths.pop();
    const target = await this.getByPath(paths);
    _.set(target, key, val)
    return val;
  }

  async applyByPath(path, ...args) {
    const paths = _.compact(_.toPath(path));
    if(!paths.length) return this;

    const key = paths.pop();
    const target = await this.getByPath(paths);
    return target[key].call(target, ...args);
  }
}


class BaseModel extends StreamableAndQueriable {
  static getClass() {
    return this.prototype.constructor;
  }

  static isModelClass = (Model) => {
    const BaseModel = this;
    return (Model && (Model.prototype instanceof BaseModel || B === BaseModel));
  }

  static fromData(data, ctx) {
    const SubModel = this.getClass();
    const instance = new SubModel(data, ctx);
    return instance;
  }

  static async fromId({ id }) {
    const getQuery = this.getDefinition().getBaseQuery();
    try {
      const rtn = await this.getDefinition().getClient().request(
        getQuery
          .update({
            alias: 'item',
            arguments: { [this.getDefinition().getKey()]: id },
          })
          .toString(),
      );
      const data = _.get(rtn, 'item');
      if(data) {
        return this.fromData(data);
      }
    } catch (err) {
      console.log(err);
    }

    throw Error('Model data is not found');
  }

  /**
   * 
   * @param {*} param0 
   */
  static async create({ id }) {
    try {

      const query = this.getDefinition().getBaseQuery();
      const mutation = query.update({
        name: this.getDefinition().GQL_ACTIONS.INSERT,
        alias: 'item',
        arguments: {object: { [this.getDefinition().getKey()]: id }},
      });
      const rtn = await this.getDefinition().getClient().request(mutation.toString());  
      const rtnData = _.get(rtn, 'item');
      if(rtnData) {
        return this.fromData(rtnData);
      }

    } catch (err) {
      console.log(err);
    }

    throw Error('Create instance error');
  }

  static getDefinition() {
    const definition = container.resolveDefinition(this.getClass());
    if(!definition) {
      throw Error('Model defintion is not defined');
    }
    return definition;
  }

  constructor(props, ctx) {
    super(props, ctx);

    const definition = this.getDefinition();

    // configure context data by using definition.getContextName
    ;(() => {
      if(definition.getContextName) {
        const contextName = definition.getContextName();
        !!contextName && this.getContext().set(contextName, this);
      }
      if(definition.name) {
        this.getContext().set(definition.name, this);
      }
      this.getContext().set('@model', this);
    })();

    // auto resolve foreignKey by using ctx
    ;(() => {
      if(definition.getForeignKeysMapping) {
        const foreignKeysMapping = definition.getForeignKeysMapping();
        _.map(foreignKeysMapping, async (mappings, fKey) => {
          const [contextName, path] = mappings;
          const target = this.getContext().get(contextName);
          if(target) {
            const fVal = _.get(target, path);
            this.set(fKey, fVal);
          }
        });
      }
    })();

    // args props
    let _args = '';

    this.setArgs = (args) => {
      _args = args;
      return this.target;
    };
  
    this.getArgs = () => {
      return _args;
    };

    this.updateArgs = (updater) => {
      if(!_.isFunction(updater)) {
        throw Error('UpdateArgs requires updater function as the input');
      }
      return this.setArgs(updater(this.getArgs()));
    }

    // selection props
    let _selections = '';

    this.setSelections = (selections) => {
      _selections = selections;
      return this.target;
    };
  
    this.getSelections = () => {
      return _selections;
    };

    this.updateSelection = (updater) => {
      if(!_.isFunction(updater)) {
        throw Error('UpdateSelection requires updater function as the input');
      }
      return this.setSelections(updater(this.getSelections()));
    }
    
    // console.log('init model', props);
    define(this);
  }

  static getSelection() {
    const definition = this.getDefinition();
    return definition.getSelection ? definition.getSelection() : `{${definition.getKey()}}`;
  }

  getSelection() {
    const definition = this.getDefinition();
    return definition.getSelection ? definition.getSelection() : `{${definition.getKey()}}`;
  }

  getDefinition() {
    const definition = container.resolveDefinition(this.constructor);
    if(!definition) {
      throw Error('Model defintion is not defined');
    }
    return definition;
  }

  getClass() {
    return this.constructor.getClass();
  }

  /**
   * basic methods for model
   *
   * @param {*} [fields=[]]
   * @returns
   * @memberof BaseModel
   */
  async sync(fields = []) {
    try {
      const select = this.getSyncQuery(fields);
      const rtn = await this.getDefinition().getClient().request(select.toString());
      const selectionPath = select.selectionPath;
      this.set(_.get(rtn, selectionPath));
      return this;  
    } catch (err) {
      console.log('syncing data failure for model:', this);
      throw err;
    }
  }

  getSyncQuery(fields = []) {

    const definition = this.getDefinition();
    let queryName = definition.GQL_ACTIONS.GET;
    // check for parentNode
    const parentMode = this.getContext().getFromParent('@model');
    let syncQuery;
    const usePlanSync = !!parentMode && (() => {
      const nodeName = this.getContext().get('nodeName');
      const parentDef = parentMode.getDefinition();

      // check if usePlanSync is defined
      const usePlanSync = !!parentDef.getNodeConfig && parentDef.getNodeConfig(nodeName, 'usePlanSync', false);
      return usePlanSync;
    })();

    if(parentMode && usePlanSync) {
      // for planSyncQuery, use nodeName as the queryName
      queryName = this.getContext().get('nodeName');
      syncQuery = parentMode
        .getSyncQuery(`${queryName} ${definition.getSelection()}`);
      this.applySelectionPathToQuery(syncQuery, queryName);
    } else {
      // no parent Node found in the current context, fallback to getSyncQuery
      const query = definition.getBaseQuery(); 
      syncQuery = query.update({
        name: definition.GQL_ACTIONS.GET,
      });
      // config keys args if configured
      const args = {};
      let hasArgs = false;
      const keys = _.compact([
        // key from getKey method
        (definition.getKey && definition.getKey()),
        // keys from getKeys method
        ..._.castArray(definition.getKeys && definition.getKeys()),
      ]);

      if(keys.length) {
        keys.map(key => {
          if(this.has(key)) {
            args[key] = this.get(key);
            hasArgs = true;
          }
        });
      }
      if(hasArgs) {
        syncQuery.update({
          arguments: ({ node }) => node.merge(args),
        });  
      }

      this.applySelectionPathToQuery(syncQuery);
    }
    
    const select = syncQuery;
    this.applyArgsToQuery(select);

    fields = _.castArray(fields || []);
    if(fields.length){
      select.update(select.selectionPath, {
        // only select list input fields to sync
        selections: ({ node }) => node.merge(fields),
      });
    }
    return select;
  }

  applyArgsToQuery(query) {
    if(!query) {
      // no target to apply
      return;
    }

    const selectionPath = query.selectionPath || '';

    // for custom selection
    if(this.getSelections()) {
      const selections = this.getSelections();
      _.castArray(selections || []).map(item => {
        if(_.isArray(item)) {
          // sub selection args settings case, first index is the sub selection, second index is the args value
          let [subSelection, val] = item;
          if(!val) {
            val = subSelection;
            subSelection = '';
          }
          const isValidLevel = (level) => (_.isLength(level) || (level && _.isString(level)));
          const updatePath = _.filter([..._.toPath(selectionPath), ..._.toPath(subSelection)], isValidLevel).join('.');
          query.update(updatePath, {
            selections: ({ node }) => node.merge(val),
          })
        } else {
          query.update(selectionPath, {
            selections: ({ node }) => node.merge(item),
          })
        }
      });
    }

    // for custom args
    if(this.getArgs()) {
      const args = this.getArgs();
      _.castArray(args || []).map(item => {
        if(_.isArray(item)) {
          // sub selection args settings case, first index is the sub selection, second index is the args value
          let [subSelection, val] = item;
          if(!val) {
            val = subSelection;
            subSelection = '';
          }
          const isValidLevel = (level) => (_.isLength(level) || (level && _.isString(level)));
          const updatePath = _.filter([..._.toPath(selectionPath), ..._.toPath(subSelection)], isValidLevel).join('.');
          query.update(updatePath, {
            arguments: ({ node }) => node.merge(val),
          })
        } else {
          query.update(selectionPath, {
            arguments: ({ node }) => node.merge(item),
          })
        }
      });
    }
  }

  applySelectionPathToQuery(query, queryName) {
    queryName = queryName || this.getDefinition().GQL_ACTIONS.GET;
    query.selectionPath = `${query.selectionPath ? `${query.selectionPath}.` : ''}${queryName}`;
  }

  async save() {
    try {
      const id = this.getId();
      if(id) {
        return this.update();
      } else {
        // new item, call the insert mutation instead
        return this.insert();
      }
      
    } catch (err) {
      throw err;
    }
  }

  /**
   * check if this model is dirty/change
   */
  isDirty() {
    return (this.getState('dirty') === true);
  }

  /**
   * check for dirst model and save
   */
  async saveIfDirty() {
    try {
      const query = this.getDefinition().getBaseQuery();
      const id = this.getId();
      if(id) {
        if(this.isDirty()) {
          return this.update();
        }
        // no update apply
        return this;  
      } else {
        // new item, call the insert mutation instead
        // check if can batch insert item
        return this.insert();
      }
      
    } catch (err) {
      throw err;
    }
  }

  async update() {
    const object = {
      ...this.pick(this.getDefinition().getFields()),
    };
    const pk_columns = { [this.getKey()]: this.getId() };

    if(this.getDefinition().GQL_ACTIONS.UPDATE_MANY && this.constructor.updateMany) {
      const [res] = this.constructor.updateMany([pk_columns, object]);
      return res;
    } else {
      const query = this.getDefinition().getBaseQuery();
      const mutation = query
        .setOperation('mutation')
        .update({
          alias: 'item',
          name: this.getDefinition().GQL_ACTIONS.UPDATE,
          arguments: {
            pk_columns: { [this.getKey()]: this.getId() },
            _set: object,
          },
        });
      // console.log('saving with mutation', mutation.toString());
      await this.getDefinition().getClient().request(mutation.toString());
      // need to update the returned data?
      return this;
    }
  }

  async insert() {
    const object = {
      ...this.pick(this.getDefinition().getFields()),
      // for new item insert, we need to add foreignKey in the query
      // ensure all foreign keys are provide for saving
      ...((() => {
        const fKeys = this.getDefinition().getForeignKeys();
        const fValues = this.pick(fKeys);
        if(_.difference(fKeys, Object.keys(fValues)).length) {
          throw Error(`Inserting new model requires foreign keys: [${fKeys.join()}], receiving only [${Object.keys(fValues).join()}]`);
        }
        return fValues;
      })()),
    };

    if(this.getDefinition().GQL_ACTIONS.INSERT_MANY && this.constructor.insertMany) {
      const [res] = this.constructor.insertMany(object);
      const rtnData = await res;
      if(rtnData) {
        this.set(rtnData);
      }
      return this;
    } else {
      const query = this.getDefinition().getBaseQuery();
      const mutation = query
        .setOperation('mutation')
        .update({
          alias: 'item',
          name: this.getDefinition().GQL_ACTIONS.INSERT,
          arguments: { object },
        });
      // console.log('creating with mutation', mutation.toString());
      const rtn = await this.getDefinition().getClient().request(mutation.toString());
      const rtnData = _.get(rtn, 'item');
      if(rtnData) {
        this.set(rtnData);
      }
      return this;
    }
  }

  async delete() {
    try {
      if(this.getDefinition().GQL_ACTIONS.DELETE_MANY && this.constructor.deleteMany) {
        const [res] = this.constructor.deleteMany(this.getId());
        return res;
      } else {
        const query = this.getDefinition().getBaseQuery();
        const mutation = query
          .setOperation('mutation')
          .update({
            name: this.getDefinition().GQL_ACTIONS.DELETE,
            arguments: { [this.getKey()]: this.getId() },
          });
        await this.getDefinition().getClient().request(mutation.toString());
        return this;  
      }
    } catch (err) {
      throw err;
    }
  }

  static async find(args, selections) {
    try {
      if(this.getDefinition().GQL_ACTIONS.FIND && this.Collection) {
        const query = this.getDefinition().getBaseQuery();
        const queryName = this.getDefinition().GQL_ACTIONS.FIND;
        query.update({
          name: queryName,
        });

        const selectionPath = '';
        _.castArray(args || []).map(item => {
          if(_.isArray(item)) {
            // sub selection args settings case, first index is the sub selection, second index is the args value
            let [subSelection, val] = item;
            if(!val) {
              val = subSelection;
              subSelection = '';
            }
            const isValidLevel = (level) => (_.isLength(level) || (level && _.isString(level)));
            const updatePath = _.filter([..._.toPath(selectionPath), ..._.toPath(subSelection)], isValidLevel).join('.');
            query.update(updatePath, {
              arguments: ({ node }) => node.merge(val),
            });
          } else {
            query.update(selectionPath, {
              arguments: ({ node }) => node.merge(item),
            });
          }
        });
        if(selections) {
          query.update({
            selections,
          });
        }
        query.selectionPath = `${queryName}`;

        const rtn = await this.getDefinition().getClient().request(query.toString());
        const rtnData = _.get(rtn, queryName, []);
        // return a collection
        return this.Collection(rtnData);
      }
      // invalid model configuration or find action is not supported
      return [];
    } catch (err) {
      throw err;
    }
  }

  static insertMany(...args) {
    const insertManyRunner = hooks.useMemo.call(this, 'insertManyRunner', () => {
      const insertManyRunner = new Streamable();
      const ref = {
        queue: [],
        ids: {},
      }

      const debounceTimer = _.debounce(() => insertManyRunner.emit('timer'), 13);
      insertManyRunner.on('queue', (...objects) => {
        ref.queue.push(..._.flatten(objects));
        debounceTimer();
      });

      insertManyRunner.on('timer', async () => {
        const batchObjects = [...ref.queue];
        if(!batchObjects.length) return;

        // reset the queue
        ref.queue = [];

        const keyName = this.getDefinition().getKey();
        const query = this.getDefinition().getBaseQuery();

        const mutation = query
          .setOperation('mutation')
          .update({
            alias: 'item',
            name: this.getDefinition().GQL_ACTIONS.INSERT_MANY,
            arguments: { objects: _.map(batchObjects, (({ object }) => object)) },
            selections: `returning {${keyName}}`,
          });
        // console.log('insert many items with muation', mutation.toString());
        const rtn = await this.getDefinition().getClient().request(mutation.toString());
        const rtnData = _.get(rtn, 'item.returning', []);

        // map rtn to promise/resovle
        batchObjects.map((item, index) => {
          const { id, object } = item;
          const { ids } = ref;
          if(ids[id]) {
            const rtn = _.get(rtnData, index);
            const res = ids[id][1];
            const resData = { ...object, ...(rtn ? rtn : {}) };
            res && res(resData);
            delete ids[id];
          }
        })
      });

      insertManyRunner.queue = (object) => {
        const id = _.uniqueId('insert_');
        if(!ref.ids[id]) {
          ref.ids[id] = [];
          ref.ids[id][0] = new Promise((res, rej) => {
            ref.ids[id][1] = res;
            ref.ids[id][2] = rej;
          });
        }
        insertManyRunner.emit('queue', { id, object });
        // return the promise object at #0
        return ref.ids[id][0];
      }
      return insertManyRunner;
    });


    try {
      const objects = _.flatten(args);
      return objects.map(obj => insertManyRunner.queue(obj));
    } catch (err) {
      throw err;
    }
  }

  // static updateMany(...args) {

  // }

  static deleteMany(...args) {
    const ids = _.flattenDeep(args);
    
    const deleteManyRunner = hooks.useMemo.call(this, 'deleteManyRunner', () => {
      const deleteManyRunner = new Streamable();
      const ref = {
        queue: [],
        ids: {},
      }

      const debounceTimer = _.debounce(() => deleteManyRunner.emit('timer'), 13);
      deleteManyRunner.on('queue', (...ids) => {
        ref.queue.push(..._.flattenDeep(ids));
        debounceTimer();
      });

      deleteManyRunner.on('timer', async () => {
        const batchIds = [...ref.queue];
        if(!batchIds.length) return;

        // reset the queue
        ref.queue = [];

        const keyName = this.getDefinition().getKey();
        const query = this.getDefinition().getBaseQuery();
        const mutation = query
          .setOperation('mutation')
          .update({
            alias: 'item',
            name: this.getDefinition().GQL_ACTIONS.DELETE_MANY,
            arguments: { where: { [keyName]: { _in: batchIds } }},
            selections: `returning {${keyName}}`,
          });
        // console.log('delete many items with muation', mutation.toString())
        const rtn = await this.getDefinition().getClient().request(mutation.toString());
        const rtnData = _.get(rtn, 'item.returning');

        // map rtn to promise/resovle
        batchIds.map(id => {
          const { ids } = ref;
          if(ids[id]) {
            const rtn = _.find(rtnData, {[keyName]: id});
            const res = ids[id][1];
            res && res(rtn);
            delete ids[id];
          }
        })
      });

      deleteManyRunner.queue = (id) => {
        if(!ref.ids[id]) {
          ref.ids[id] = [];
          ref.ids[id][0] = new Promise((res, rej) => {
            ref.ids[id][1] = res;
            ref.ids[id][2] = rej;
          });
        }
        deleteManyRunner.emit('queue', id);
        // return the promise object at #0
        return ref.ids[id][0];
      }
      return deleteManyRunner;
    });


    try {
      return ids.map(id => deleteManyRunner.queue(id));
    } catch (err) {
      throw err;
    }
  }

  subscribe(field = '') {
    const client = this.getDefinition().getClient();
    if(!client.subscribe) {
      throw Error('Client does not support subscribe method');
    }
    // check for nested field selection
    if(_.indexOf(field, '.') >= 0) {
      const paths = _.toPath(field);
      const subField = paths.pop();
      return new Promise(async (res, rej) => {
        const target = await this.getByPath(paths.join('.'));
        if(target && target.subscribe) {
          return res(target.subscribe(subField));
        }
        rej(Error(`Invalid field ${field} to apply subscribe`));
      });
    }
    // build plan query for this object
    try {
      const [subsMan, ref] = hooks.useMemo.call(this, 'subsMan', () => {
        const subsMan = new SubscriptionMan(this);
        this.on('change', _.debounce(() => {
          subsMan.scan();
        }));

        const ref = {
          fields: [],
          currObs: null,
          currQuery: '',
        };

        return [subsMan, ref];
      });


      ref.fields.push(..._.castArray(field || []));
      ref.fields = _.uniq(ref.fields);

      const definition = this.getDefinition();
      const buildSelectionFieldForSubscription = (fields) => {
        return fields.map(field => {
          if(definition.isNode(field)) {
            const nodeModel = definition.getNodeModel(field);
            return `${field} ${nodeModel.getSelection()}`;
          }
          return field;
        });
      };

      const select = this.getSyncQuery(buildSelectionFieldForSubscription(ref.fields));
      select.setOperation('subscription');
      const selectionPath = select.selectionPath;

      // merge query
      const queryStr = select.toString();
      const prevQuery = ref.currQuery;
      const target = this;

      const currQuery = queryStr;
      const subscription = client.subscribe(currQuery);
      const prevObs = ref.currObs;
      if(!prevObs || (prevQuery !== currQuery)) {
        ref.currObs = subscription.subscribe({
          next: (res) => {
            const { data } = res;
            if(data) {
              const rtnData = _.get(data, selectionPath);
              target.set(rtnData);
            }
          }
        });
        ref.currQuery = currQuery;
  
        if(prevObs) {
          // unsubscribe prev Op
          prevObs.unsubscribe();
        }  
      }

      return subsMan.subscription(field);
    } catch (err) {
      console.log('subscription failure for model:', this);
      throw err;
    }
  }
}


module.exports = BaseModel;
