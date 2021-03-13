const _ = require('lodash');
const utils = require('../utils');

const privateData = utils.privateDataWrapper({
  listeners: () => ({})
});

class Streamable {
  emit(event, ...params) {
    return _.get(privateData.get(this, 'listeners'), [event], []).map(listener => listener.call(this, ...params));
  }

  on(event, listener) {
    _.update(privateData.get(this, 'listeners'), [event], val => (val ? val.concat(listener) : [listener]));
    return () => {
      _.update(privateData.get(this, 'listeners'), [event], val => (_.filter((val || []), item => (item !== listener))));
    };
  }

  once(event, listener) {
    const handlers = {
      listener: (...args) => {
        // self disposing
        if(handlers.disposer) {
          handlers.disposer();
          handlers.disposer = null;
          handlers.listener = null;
        } 
        return listener.call(...args);
      },
      disposer: null,
    }
    handlers.disposer = this.on(event, handlers.listener);
    return handlers.disposer;
  }

  destroy() {
    privateData.set(this, 'listeners', {});
  }
}

module.exports = Streamable;
