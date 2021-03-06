const _ = require('lodash');

class Streamable {
  listeners = {};
  emit(event, ...params) {
    _.get(this.listeners, [event], []).map(listener => listener.call(this, ...params));
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

module.exports = Streamable;
