const _ = require('lodash');
const utils = require('../utils');

const privateData = utils.privateDataWrapper({
  listeners: () => ({})
});

class Streamable {
  emit(event, ...params) {
    _.get(privateData.get(this, 'listeners'), [event], []).map(listener => listener.call(this, ...params));
  }

  on(event, listener) {
    _.update(privateData.get(this, 'listeners'), [event], val => (val ? val.concat(listener) : [listener]));
    return () => {
      _.update(privateData.get(this, 'listeners'), [event], val => (_.reject((val || []), listener)));
    };
  }

  once(event, listener) {
    const handlers = {
      disposer: () => {
        _.update(privateData.get(this, 'listeners'), [event], val => (_.reject((val || []), handlers.listener)));
      },
      listener: (...args) => {
        // self disposing
        handlers.disposer();
        listener.call(...args);
      }
    }
    _.update(privateData.get(this, 'listeners'), [event], val => (val ? val.concat(handlers.listener) : [handlers.listener]));
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
    privateData.set(this, 'listeners', {});
  }
}

module.exports = Streamable;
