const _ = require('lodash');

const utils = require('./utils');

const privateRefData = utils.privateDataWrapper({
  container: () => ({}),
  path: () => '',
});

class RefData {
  constructor(container, path) {
    privateRefData.set(this, 'container', container);
    privateRefData.set(this, 'path', path);
  }

  getTarget() {
    return _.get(privateRefData.get(this, 'container'), privateRefData.get(this, 'path'));
  }

  get(...args) {
    // root not getter
    if (args.length === 0) {
      return this.getTarget();
    }
    const [key, def] = args;
    return _.get(this.getTarget(), key, def);
  }
  set(...args) {
    // root not setter
    if (args.length === 1) {
      const [val] = args;
      return _.set(privateRefData.get(this, 'container'), privateRefData.get(this, 'path'), val);
    }

    const [key, val] = args;
    return _.set(this.getTarget(), key, val);
  }
  has(key) {
    return _.has(this.getTarget(), key);
  }

  static create(container, path) {
    const inst = new RefData(container, path);

    const ref = {
      inst: _.memoize(() => inst.get() || {}),
      mixins: _.memoize(() => new RefData(ref.target(), path)),
      target: _.memoize(() => new Proxy(ref.inst(), ref.handlers())),
      handlers: _.memoize(() => ({
        get(obj, prop) {
          if (['get', 'set'].includes(prop)) {
            const mixins = ref.mixins();
            return mixins[prop].bind(obj);
          } else if (prop === 'getTarget') {
            return null;
          }
          return obj[prop];
        },
        set(obj, prop, val) {
          const mixins = ref.mixins();
          if (['get', 'set'].includes(prop)) {
            return null;
          } else if (prop === 'getTarget') {
            return null;
          }
          mixins.set(prop, val);
          obj[prop] = val;
          return val;
        },
        has(obj, key) {
          const mixins = ref.mixins();
          return mixins.has(key);
        },
      })),
    };
    return ref.target();
  }
}

module.exports = RefData;
