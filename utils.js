const _ = require('lodash');

const utils = {}

utils.isIndex = (val) => {
  if(Number.isNaN(val)) return false;
  try {
    val = parseInt(val);
  } catch (err) {
    return false;
  }
  return _.isLength(val);
};

utils.isRootPath = (val) => {
  return (!val && val !== 0);
}

utils.isPromise = (val) => {
  return (val && typeof val.then === 'function');
}

utils.getByPath = (target, path, def) => {
  const paths = _.compact(_.toPath(path));
  if(!paths.length) return target;

  if(utils.isPromise(target)) {
    return new Promise(async (res, rej) => {
      try {
        const curr = await target;
        res(utils.getByPath(curr, path, def));
      }
      catch (err) {
        rej(err);
      }
    })
  }

  let curr = target;
  const size = paths.length - 1;
  for(let index = 0; index < paths.length; index++) {
    const level = paths[index];
    curr = curr[level];
    if(utils.isPromise(curr)) {
      return utils.getByPath(curr, paths.slice(index + 1), def);
    }
    if(!curr && (index < size))  {
      return def;
    }
  }
  return curr;
};

utils.setByPath = (target, path, val) => {
  const paths = _.compact(_.toPath(path));
  if(!paths.length) return target;

  const key = paths.pop();
  let container = utils.getByPath(target, paths);
  if(utils.isPromise(container)) {
    return new Promise(async (res, rej) => {
      try {
        container = await container;
        res(_.set(container, key, val));
      } catch(err) {
        rej(err);
      }
    })
  }
  return _.set(container, key, val);
};

utils.applyByPath = (target, path, ...args) => {
  const paths = _.compact(_.toPath(path));
  if(!paths.length) return this;

  const key = paths.pop();
  let container = utils.getByPath(target, paths);
  if(utils.isPromise(container)) {
    return new Promise(async (res, rej) => {
      try {
        container = await container;
        res(container[key].call(container, ...args));
      } catch(err) {
        rej(err);
      }
    })
  }
  return container[key].call(container, ...args);
}

utils.deThenableProxy = (inst) => {
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


const getInitVal = (initVal) => {
  if(typeof initVal === 'function') {
    initVal = initVal();
  }
  return initVal;
}

utils.privateDataWrapper = (options) => {
  const containerMap = new WeakMap();
  const ensureTargetData = (target) => {
    if(!containerMap.has(target)) {
      const data = {};
      containerMap.set(target, data);
      // apply initter for all initer
      options && _.map(options, (val, key) => {
        data[key] = getInitVal(val);
      });
    }
    return containerMap.get(target);
  }

  return {
    get: (target, key, def) => {
      const data = ensureTargetData(target, key);
      return _.get(data, key, def);
    },
    set: (target, key, value) => {
      const data = ensureTargetData(target, key);
      return _.set(data, key, value);
    },
    has: (target, key) => {
      const data = ensureTargetData(target, key);
      return _.has(data, key);
    },
  };
};


module.exports = utils;
