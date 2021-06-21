const _ = require('lodash');
const RefData = require('../RefData');
const utils = require('../utils');
const CollectionMixins = require('./mixins');

function Collection(Type, ...args) {
  if (!Type) {
    throw Error('Missing collection Type input');
  }

  const [props, ctx] = args;

  const ref = {
    inst: _.memoize(() => props || new RefData({ ref: [] }, 'ref')),
    mixins: _.memoize(() => new CollectionMixins(Type, ref.target(), ref.inst(), ctx)),
    target: _.memoize(() => new Proxy(ref.inst(), ref.handlers())),
    handlers: _.memoize(() => ({
      set(obj, prop, value) {
        if (prop === 'length') {
          obj[prop] = value;
          ref.mixins().emit('change', prop);
          return true;
        } else if (utils.isIndex(prop)) {
          obj[prop] = value;
          ref.mixins().emit('change', prop);
          return true;
        } else if (prop === 'then') {
          return true;
        } else {
          obj[prop] = value;
          return true;
        }
      },
      get(obj, prop) {
        const mixins = ref.mixins();
        if (mixins[prop]) {
          return mixins[prop];
        } else if (utils.isIndex(prop)) {
          // accessing to collection index
          const pureData = obj[prop];
          if (!pureData) return pureData;

          // auto cast to ModelType for index getting
          const castedVal = ref.mixins().castType(pureData);
          if (castedVal !== pureData) {
            obj[prop] = castedVal;
          }
          return castedVal;
        }
        return obj[prop];
      },
    })),
  };
  return ref.target();
}

module.exports = Collection;
