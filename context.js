const _ = require('lodash');

const NOT_FOUND = null;

const tagsify = (val) => {
  if (_.isString(val)) {
    return _.split(val, ' ');
  }
  if (_.isArray(val)) {
    return val;
  }
  return [val];
};

class Context {
  constructor(parent, options) {
    const { data, tags } = options || {};
    this.parent = parent || null;
    this.data = data || {};
    this.NOT_FOUND = NOT_FOUND;
    this.tags = tagsify(tags) || [];
  }

  makeChild(options) {
    const Ctx = this.constructor;
    return new Ctx(this, options);
  }

  get(key, defVal = NOT_FOUND) {
    if (this.has(key)) {
      return _.get(this.data, key, defVal);
    } else {
      return this.getFromParent(key, defVal);
    }
  }

  has(key) {
    return _.has(this.data, key);
  }

  getFromParent(key, defVal = NOT_FOUND) {
    if (this.parent) {
      return this.parent.get(key, defVal);
    }
    return defVal;
  }

  set(...args) {
    if (args.length === 1 && _.isPlainObject(args[0])) {
      for (let key of _.keys(args[0])) {
        const val = args[0][key];
        _.set(this.data, key, val);
        this.emit && this.emit('change', key, val);
      }
      return this;
    }

    if (args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(this.data, key, val);
      this.emit && this.emit('change', key, val);
      return this;
    }
  }

  getPathToRoot() {
    let rtn = [];
    if (this.parent) {
      rtn = [this.tags, ...this.parent.getPathToRoot()];
    } else {
      rtn = [this.tags];
    }
    return rtn;
  }

  getChain(key) {
    let rtn = [];
    if (this.has(key)) {
      rtn.push(this.get(key));
    }
    if (this.parent) {
      rtn.push(...this.parent.getChain(key));
    }
    return rtn;
  }

  toString() {
    return 'context';
  }
}

module.exports = Context;
