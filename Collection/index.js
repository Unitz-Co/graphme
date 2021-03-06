const _ = require('lodash');

class CollectionMixins {
  constructor(Type, target) {
    const getType = () => Type;
    const castType = (item) => {
      if(item instanceof Type) {
        return item;
      }
      return new Type(item);  
    }

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
  
  }

  // redefine all array methods here
  add(item) {
    this.target.push(this.castType(item));
    return this.target;
  }

  async sync() {
    // reload data from server
    const rtn = this.emit('onSync');
    await Promise.all(rtn);
    return null;
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
        const arr = this.target.map(item => item);
        cb(arr);
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
}

function Collection(Type, ...args) {
  if(!Type) {
    throw Error('Missing collection Type input');
  }

  // const inst = new CollectionArray(Type, ...args);
  const ref = {
    inst: _.memoize(() => []),
    mixins: _.memoize(() => new CollectionMixins(Type, ref.target())),
    target: _.memoize(() => new Proxy(ref.inst(), ref.handlers())),
    handlers: _.memoize(() => ({
      set(obj, prop, value) {
        if(prop === 'length') {
          obj[prop] = value;
          return true;
        } else {
          const castedVal = ref.mixins().castType(value);
          obj[prop] = castedVal;
          return true;
        }
      },
      get(obj, prop) {
        const mixins = ref.mixins();
        if(mixins[prop]) {
          return mixins[prop];
        }
        return obj[prop];
      }
    })),
  }
  return ref.target();
}

module.exports = Collection;
