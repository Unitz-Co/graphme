const _ = require('lodash');

const Streamable = require('./Streamable');
const Context = require('../context');
const utils = require('../utils');
const RefData = require('../RefData');

const privateData = utils.privateDataWrapper({
  props: () => ({}),
  state: () => ({}),
});

class StreamableAndQueriable extends Streamable {
  constructor(props, ctx) {
    super();
    // create context chain
    this.setContext(new Context(ctx, { data: { type: 'Model'} }));

    // hoisted all props to the root query select model?
    // if(ctx) {
    //   const parentNode = ctx.get('@node');
    //   const selectionPathToRoot = ctx.getChain('nodeName');
    //   console.log('asdasdasdasdasdasd', selectionPathToRoot, parentNode, ctx);
    // }
    // init data if provided
    if(props) {
      // this.set(props);
      privateData.set(this, 'props', props);
    }
  }

  setContext(ctx) {
    return privateData.set(this, 'ctx', ctx);
  }

  getContext() {
    return privateData.get(this, 'ctx');
  }

  set(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];
        this.set(key, val);
      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(privateData.get(this, 'props'), key, val);
      // _.set(this, key, val);
      this.emit && this.emit('change', key, val);
      return this;
    }
  }

  has(key) {
    return (
      _.has(privateData.get(this, 'props'), key) ||
      _.hasIn(privateData.get(this, 'props'), key) ||
      _.has(privateData.get(this, 'nodes'), key)
    );
  }

  get(...args) {
    if(args.length === 0) {
      return privateData.get(this, 'props');
    }
    const [key, def] = args;
    return _.get(privateData.get(this, 'props'), key, def);
  }

  getRef(key) {
    if(utils.isRootPath(key)) {
      return privateData.get(this, 'props');
    }
    return RefData.create(privateData.get(this, 'props'), key);
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

  setNode(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];
        this.setNode(key, val);
      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(privateData.get(this, 'nodes'), key, val);
      this.emit && this.emit('change', key, val);
      return this;
    }
  }

  hasNode(key) {
    return _.has(privateData.get(this, 'nodes'), key);
  }

  getNode(...args) {
    if(args.length === 0) {
      return privateData.get(this, 'nodes');
    }
    const [key, def] = args;
    return _.get(privateData.get(this, 'nodes'), key, def);
  }

  setState(...args) {
    if(args.length === 1 && _.isPlainObject(args[0])) {
      for(let key of _.keys(args[0])) {
        const val = args[0][key];
        this.setState(key, value);
      }
      return this;
    }

    if(args.length === 2) {
      const [key, val] = args;
      // trigger change event
      _.set(privateData.get(this, 'state'), key, val);
      this.emit && this.emit('changeState', key, val);
      return this;
    }
  }

  hasState(key) {
    return _.has(privateData.get(this, 'state'), key);
  }

  getState(...args) {
    if(args.length === 0) {
      return privateData.get(this, 'state');
    }
    const [key, def] = args;
    return _.get(privateData.get(this, 'state'), key, def);
  }

  pickState(props) {
    const rtn = {};
    _.castArray(props || []).map(prop => {
      if(_.isArray(prop) && prop.length >= 2) {
        let [key, def, alias] = prop;
        alias = alias || key;
        if(this.has(key)) {
          rtn[alias] = this.getState(key, def);
        }
      } else if(_.isString(prop)) {
        let key = prop;
        if(this.has(key)) {
          rtn[key] = this.getState(key);
        }
      }
    });
    return rtn;
  }

  getByPath(path, def) {
    return utils.getByPath(this, path, def);
  }

  setByPath(path, val) {
    return utils.setByPath(this, path, val);
  }

  applyByPath(path, ...args) {
    return utils.applyByPath(this, path, ...args);
  }
}

module.exports = StreamableAndQueriable;
