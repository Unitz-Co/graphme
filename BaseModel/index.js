const _ = require('lodash');

const StreamableAndQueriable = require('./StreamableAndQueriable');
const Streamable = require('./Streamable');
const container = require('../container');
const define = require('../define');
const hooks = require('../hooks');
const Context = require('../context');
const SubscriptionMan = require('../SubscriptionMan');
const utils = require('../utils');

const privateData = utils.privateDataWrapper();

class BaseModel extends StreamableAndQueriable {
  static getClass() {
    return this.prototype.constructor;
  }

  static isModelClass = (Model) => {
    return (Model && (Model.prototype instanceof BaseModel || Model === BaseModel));
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

    // not found model by id, return null
    return null;
  }

  /**
   * 
   * @param {*} param0 
   */
  static async create(object) {
    try {

      const query = this.getDefinition().getBaseQuery();
      const mutation = query
        .setOperation('mutation')
        .update({
          name: this.getDefinition().GQL_ACTIONS.INSERT,
          alias: 'item',
          arguments: {
            // object: { [this.getDefinition().getKey()]: id },
            object,
          },
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

    if(!definition) {
      throw Error('Missing Model definition');
    }

    // configure context data by using definition.getContextName

    definition.with('getContextName', (contextName) => {
      !!contextName && this.getContext().set(contextName, this);
    });
    definition.with('name', (name) => {
      !!name && this.getContext().set(definition.name, this);
    });
    this.getContext().set('@model', this);
    this.getContext().set('@node', this);

    // auto resolve foreignKey by using ctx
    definition.with('getForeignKeysMapping', (foreignKeysMapping) => {
      _.map(foreignKeysMapping, async (mappings, fKey) => {
        const [contextName, path] = mappings;
        const target = this.getContext().get(contextName);
        if(target) {
          const fVal = _.get(target, path);
          this.set(fKey, fVal);
        }
      });
    });

    // console.log('init model', props);
    define(this);

    /**
     * PromiseLike object 
     *
     */
    Object.defineProperty(this, 'then', {
      value: (cb) => {
        const rtn = this.sync();
        this.then = null;
        if(rtn && rtn.then) {
          rtn.then(() => {
            // remove thenable
            cb(this);
          })
        } else {
          cb(rtn);
        }  
      },
      writable: true,
      enumerable: false,
    });
  }

  static getSelection() {
    const definition = this.getDefinition();
    return definition.getSelection ? definition.getSelection() : `{${definition.getKeys()}}`;
  }

  setArgs(args) {
    privateData.set(this, 'args', args);
    return this;
  };

  getArgs(){
    return privateData.get(this, 'args');
  };

  updateArgs(updater){
    if(!_.isFunction(updater)) {
      throw Error('UpdateArgs requires updater function as the input');
    }
    return this.setArgs(updater(this.getArgs()));
  }

  setSelections(selections) {
    privateData.set(this, 'selections', selections);
    return this;
  };

  getSelections(){
    return privateData.get(this, 'selections');
  };

  updateSelections(updater){
    if(!_.isFunction(updater)) {
      throw Error('updateSelections requires updater function as the input');
    }
    return this.setSelections(updater(this.getSelections()));
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

  toObject() {
    const rtn = this.get() || {};
    return rtn;
  }

  getId() {
    const idKey = this.getKey();
    return this.get(idKey);
  }

  getKey() {
    return this.getDefinition().getKey();
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
      const parentMode = this.getContext().getFromParent('@model');
      const nodeName = this.getContext().get('nodeName');
      if(parentMode && !_.has(parentMode.toObject(), nodeName)) {
        // try to ask parent to sync data
        parentMode.updateSelections(selection => `${selection ? selection : ''} ${nodeName} ${this.getSelection()}`);
        await parentMode.sync();
        // apply data
        this.set(_.get(parentMode.toObject(), nodeName));
      }
      const select = this.getSyncQuery(fields);
      const rtn = await this.getDefinition().getClient().request(select.toString());
      const selectionPath = select.selectionPath;
      this.set(_.get(rtn, selectionPath));
      // remove thenable
      this.then = null;
      return this;  
    } catch (err) {
      console.log('syncing data failure for model:', this, this.getClass());
      console.log('errerrerr', err);
      this.then = null;
    }
    return this;
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
      const keys = _.uniq(_.compact([
        // key from getKey method
        (definition.getKey && definition.getKey()),
        // keys from getKeys method
        ..._.castArray(definition.getKeys && definition.getKeys()),
      ]));

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

  async isExists() {
    const id = this.getId();
    if(id === undefined || id === null) return false;

    if(!this.hasState('isExists')) {
      let isExists = false;
      try {
        const ModelClass = this.getClass();
        const model = await ModelClass.fromId({ id });
        isExists = !!model;
      } catch (err) {
        isExists = false;
      }
      this.setState({ isExists });
    }
    return this.getState('isExists');
  }

  async save() {
    try {
      // check for existsing
      if(await this.isExists()) {
        // query for the item before
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

  static getFindQuery(args, selections) {
    if(!this.getDefinition().GQL_ACTIONS.FIND) {
      throw Error('Find query is not defined for this model');
    }
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
    return query;
  }

  static async find(args, selections) {
    try {
      if(this.getDefinition().GQL_ACTIONS.FIND && this.Collection) {
        const query = this.getFindQuery(args, selections);
        const rtn = await this.getDefinition().getClient().request(query.toString());
        const queryName = this.getDefinition().GQL_ACTIONS.FIND;
        const rtnData = _.get(rtn, queryName, []);
        // return a collection
        const col = this.Collection(rtnData);
        col.setArgs(args)
        col.setSelections(selections)
        return col;
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

  observe(field = '') {
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
        if(target && target.observe) {
          return res(target.observe(subField));
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
