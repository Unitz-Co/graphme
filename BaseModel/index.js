const _ = require('lodash');

const Streamable = require('./Streamable');
const container = require('../container');
const define = require('../define');

class StreamableAndQueriable extends Streamable {
  data = {};
  state = {};

  set(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];
        _.set(this.data, key, val);
        this.emit && this.emit('change', key, val);
      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(this.data, key, val);
      this.emit && this.emit('change', key, val);
      return this;
    }
  }

  has(key) {
    return _.has(this.data, key);
  }

  get(...args) {
    if(args.length === 0) {
      return this.data;
    }
    const [key, def] = args;
    return _.get(this.data, key, def);
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
}


class BaseModel extends StreamableAndQueriable {
  static getClass() {
    return this.prototype.constructor;
  }

  static isModelClass = (Model) => {
    const BaseModel = this;
    return (Model && (Model.prototype instanceof BaseModel || B === BaseModel));
  }

  static fromData(data) {
    const SubModel = this.getClass();
    const instance = new SubModel();
    instance.set(data);
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

  constructor() {
    super();
    define(this);
  }

  getDefinition() {
    const definition = container.resolveDefinition(this.constructor);
    if(!definition) {
      throw Error('Model defintion is not defined');
    }
    return definition;
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
      const query = this.getDefinition().getBaseQuery();
      const queryName = this.getDefinition().GQL_ACTIONS.GET;

      const select = query.clone().update({
        alias: 'item',
        name: queryName,
        arguments: { [this.getKey()]: this.getId() },
      })
      if(fields.length){
        select.update(queryName, {
          // only select list input fields to sync
          selections: ({ node }) => node.merge(fields),
        });
      }

      // console.log('syncing with query', select.toString());
      const rtn = await this.getDefinition().getClient().request(select.toString());
      // console.log('rtn', rtn);
      this.set(_.get(rtn, 'item'));
      // console.log('apply', this.get());
      return this;  
    } catch (err) {
      throw err;
    }
  }

  async save() {
    try {
      const query = this.getDefinition().getBaseQuery();
      const id = this.getId();
      if(id) {
        const mutation = query
          .setOperation('mutation')
          .update({
            alias: 'item',
            name: this.getDefinition().GQL_ACTIONS.UPDATE,
            arguments: {
              pk_columns: { [this.getKey()]: this.getId() },
              _set: {
                ...this.pick(this.getDefinition().getFields())
              },
            },
          });
        // console.log('saving with mutation', mutation.toString());
        await this.getDefinition().getClient().request(mutation.toString());
        // need to update the returned data?
        return this;  
      } else {
        // new item, call the insert mutation instead
        const mutation = query
          .setOperation('mutation')
          .update({
            alias: 'item',
            name: this.getDefinition().GQL_ACTIONS.INSERT,
            arguments: {
              object: {
                ...this.pick(this.getDefinition().getFields()),
                // for new item insert, we need to add foreignKey in the query
                ...this.pick(this.getDefinition().getForeignKeys()),
              },
            },
          });
        // console.log('creating with mutation', mutation.toString());
        const rtn = await this.getDefinition().getClient().request(mutation.toString());
        const rtnData = _.get(rtn, 'item');
        if(rtnData) {
          this.set();
        }
        return this;
      }
      
    } catch (err) {
      throw err;
    }
  }

  async delete() {
    try {
      const query = this.getDefinition().getBaseQuery();
      const mutation = query
        .setOperation('mutation')
        .update({
          alias: 'item',
          name: this.getDefinition().GQL_ACTIONS.DELETE,
          arguments: { [this.getKey()]: this.getId() },
        });
      await this.getDefinition().getClient().request(mutation.toString());
      return this;  
    } catch (err) {
      throw err;
    }
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

module.exports = BaseModel;
