const _ = require('lodash');

const Context = require('../context');
const CacheMan = require('../CacheMan');
const hooks = require('../hooks');
const SubscriptionMan = require('../SubscriptionMan');
const utils = require('../utils');

class CollectionMixins {
  constructor(Type, target, inst, ctx) {
    const getType = () => Type;
    // caching castType by item id
    const cacheInstance = new CacheMan({
      initer: (item) => new Type(item, this.getContext()),
      getId: (item) => {
        const keyName = Type.getDefinition().getKey();
        if(keyName && _.has(item, keyName)) {
          return _.get(item, keyName);
        }
      }
    })
    const castType = (item) => {
      if(item instanceof Type) {
        return item;
      }
      return cacheInstance.get(item);
    }

    this.inst = inst;
    this.target = target;
    this.Type = Type;

    this.getType = getType;

    this.castType = castType;

    // for argsstr
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

    // create context chain
    let container = {
      context: new Context(ctx, { data: { type: 'Collection'} }),
    };
    this.setContext = (ctx) => {
      container.context = ctx;
    }
    this.getContext = () => {
      return container.context;
    }
  }

  // redefine all array methods here
  add(item) {
    const newItem = this.castType(item);
    this.target.push(newItem);
    return newItem;
  }

  _updateCollectionData(data) {
    const len = this.target.length;
    const arrData = _.castArray(data || []);
    arrData.map((item, index) => {
      this[index] = item;
    })
    if(arrData.length < len) {
      this.target.splice(arrData.length, len);
    }
  }

  async save() {
    // apply saving method for all items in the collection
    await Promise.all(this.target.map(async (item) => {
      try {
        await item.saveIfDirty();
      } catch (err) {
        // console.log(err);
      }
    }));
    return this.target;
  }

  async sync() {
    // reload data from server
    const rtn = this.emit('onSync');
    const data = await Promise.all(rtn);
    return null;
  }

  observe(field = '') {
    const NodeModel = this.getType();

    // build plan query for this object
    try {
      const [subsMan, ref] = hooks.useMemo.call(this, 'subsMan', () => {
        const subsMan = new SubscriptionMan(this);
        this.on('change', _.debounce(() => subsMan.scan()));

        const ref = {
          fields: [],
          currObs: null,
          currQuery: '',
        };
        ref.fields.push(..._.castArray(field || []));
        ref.fields = _.uniq(ref.fields);
        // const target = this;
  
        const instance = this.getContext().get('@model');


        if(instance) {
          const nodeName = this.getContext().get('nodeName');
          let argsStr = this.getArgs();
          argsStr = argsStr ? `(${argsStr})` : '';

          const observer = instance.observe(`${nodeName}`);

          ref.currObs = observer.subscribe((data) => {
            this._updateCollectionData(data);
          });
        } else {

          const client = NodeModel.getDefinition().getClient();
          if(!client.subscribe) {
            throw Error('Client does not support subscribe method');
          }     
          // no parent instance found, root collection query?
          const select = NodeModel.getFindQuery(this.getArgs(), this.getSelections());
          select.setOperation('subscription');

          // merge query
          const queryStr = select.toString();
          const prevQuery = ref.currQuery;

          const currQuery = queryStr;
          const observer = client.subscribe(currQuery);
          const prevObs = ref.currObs;
          if(!prevObs || (prevQuery !== currQuery)) {
            ref.currObs = observer.subscribe({
              next: (res) => {
                const selectionPath = select.selectionPath;
                const { data } = res;
                if(data) {
                  const rtnData = _.get(data, selectionPath);
                  this._updateCollectionData(rtnData);
                }
              }
            });
            ref.currQuery = currQuery;
      
            if(prevObs) {
              // unsubscribe prev Op
              prevObs.unsubscribe();
            }  
          }
        }
    
        return [subsMan, ref];
      });
      return subsMan.subscription(field);

    } catch (err) {
      console.log('subscription failure for model:', this);
      throw err;
    }
  }

  /**
   * PromiseLike object for the collection
   *
   * @memberof CollectionArray
   */
  then(cb) {
    const rtn = this.sync();
    if(rtn && rtn.then) {
      rtn.then(() => {
        // resolve the promise with thenable
        cb(utils.deThenableProxy(this));
      })
    } else {
      cb([]);
    }
  }

  toArray() {
    return this.inst;
  }

  toObject() {
    return this.toArray();
  }

  // streamable interface
  listeners = {};
  emit(event, ...params) {
    return _.get(this.listeners, [event], []).map(listener => listener.call(this, ...params));
  }

  on(event, listener) {
    _.update(this.listeners, [event], val => (val ? val.concat(listener) : [listener]));
    return () => {
      _.update(this.listeners, [event], val => (_.reject((val || []), listener)));
    };
  }

  once(event, listener) {
    const handlers = {
      disposer: () => {
        _.update(this.listeners, [event], val => (_.reject((val || []), handlers.listener)));
      },
      listener: (...args) => {
        // self disposing
        handlers.disposer();
        listener.call(...args);
      }
    }
    _.update(this.listeners, [event], val => (val ? val.concat(handlers.listener) : [handlers.listener]));
    return handlers.disposer;
  }

  proxy(stream, events) {
    const dispoers = [].concat(events || _.keys(stream.listeners)).map((event) => {
      return stream.on(event, (...params) => {
        this.emit(event, ...params);
      });
    });
    return () => dispoers.map(dis => dis());
  }

  destroy() {
    this.listeners = {};
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

  getDefinition() {
    // @TODO: generate collection definition from model definition
    const Type = this.getType();
    const definition = Type.getDefinition();
    return definition;
  }
}

module.exports = CollectionMixins;
