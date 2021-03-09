const _ = require('lodash');
const Context = require('../context');
const CacheMan = require('../CacheMan');
const hooks = require('../hooks');
const SubscriptionMan = require('../SubscriptionMan');

const DeThenableProxy = (inst) => {
  const ref = {
    inst: _.memoize(() => inst),
    target: _.memoize(() => new Proxy(ref.inst(), ref.handlers())),
    handlers: _.memoize(() => ({
      get(obj, prop) {
        if(prop === 'then') {
          return undefined;
        }
        return obj[prop];
      }
    })),
  }
  return ref.target();
};

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

  subscribe(field = '') {
    const NodeModel = this.getType();

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
        ref.fields.push(..._.castArray(field || []));
        ref.fields = _.uniq(ref.fields);
        // const target = this;
  
        const instance = this.getContext().get('@model');


        if(instance) {
          const nodeName = this.getContext().get('nodeName');
          let argsStr = this.getArgs();
          argsStr = argsStr ? `(${argsStr})` : '';
          const selectionPath = `${nodeName}`;

          const subscription = instance.subscribe(`${nodeName}`);

          ref.currObs = subscription.subscribe((data) => {
            const len = this.target.length;
            const arrData = _.castArray(data || []);
            arrData.map((item, index) => {
              this[index] = item;
            })
            if(arrData.length < len) {
              this.target.splice(arrData.length, len);
            }
          });
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
        cb(DeThenableProxy(this));
      })
    } else {
      cb([]);
    }
  }

  toArray() {
    return this.target.map(item => item);
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

const isIndex = (val) => {
  if(Number.isNaN(val)) return false;
  try {
    val = parseInt(val);
  } catch (err) {
    return false;
  }
  return _.isLength(val);
};

function Collection(Type, ...args) {
  if(!Type) {
    throw Error('Missing collection Type input');
  }


  const [props, ctx] = args;
  const ref = {
    inst: _.memoize(() => _.castArray(props || [])),
    mixins: _.memoize(() => new CollectionMixins(Type, ref.target(), ref.inst(), ctx)),
    target: _.memoize(() => new Proxy(ref.inst(), ref.handlers())),
    handlers: _.memoize(() => ({
      set(obj, prop, value) {
        if(prop === 'length') {
          obj[prop] = value;
          ref.mixins().emit('change', prop);
          return true;
        } else if(isIndex(prop)) {
          obj[prop] = value;
          ref.mixins().emit('change', prop);
          return true;
        } else {
          obj[prop] = value;
          return true;
        }
      },
      get(obj, prop) {
        const mixins = ref.mixins();
        if(mixins[prop]) {
          return mixins[prop];
        } else if(isIndex(prop)) {
          // accessing to collection index
          const pureData = obj[prop];
          if(!pureData) return pureData;

          // auto cast to ModelType for index getting
          const castedVal = ref.mixins().castType(pureData);
          if(castedVal !== pureData) {
            obj[prop] = castedVal;
          }
          return castedVal;
        }
        return obj[prop];
      }
    })),
  }
  return ref.target();
}

module.exports = Collection;
