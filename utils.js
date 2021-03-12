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
