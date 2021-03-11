const _ = require('lodash');

const ensureArray = (container, path) => {
  _.update(container, path, (curr) => (curr ? curr : []))
  return _.get(container, path);
}

const isRootPath = (val) => ((val !== 0) && !val);

class SubscriptionMan {
  constructor(target) {

    const data = {
      listenersByPath: {},
      prevValuesByPath: {},
      susbcriptionsByPath: {},
    }

    const methods = {
      subscription: (path) => {
        _.update(data.susbcriptionsByPath, [path], (sub) => {
          if(!sub) {
            const listeners = ensureArray(data, ['listenersByPath', path]);
            const subscription = {
              subscribe(...args) {
                const [cb] = args;
                listeners.push(cb);
                return {
                  unsubscribe() {
                    const foundIndex = listeners.indexOf(cb);
                    if(foundIndex >=0 ) {
                      listeners.splice(foundIndex, 1);
                    }
                  }
                }
              }
            };
            return subscription;
          }
          return sub;
        });
        return _.get(data.susbcriptionsByPath, [path]);
      },
      scan: _.debounce(() => {
        _.map(data.listenersByPath, (listeners, path) => {
          const prevValue = _.get(data.prevValuesByPath, path);
          const curValue = isRootPath(path) ? target : _.get(target, path);

          if(!_.isEqual(prevValue, curValue)) {
            // trigger all callback in the listeners
            listeners.map((cb) => {
              if(cb && _.isFunction(cb)) {
                cb(curValue);
              }
            });
            // update prevValue
            _.set(data.prevValuesByPath, path, _.cloneDeep(curValue));
          }
        });
      }, 10),
    }
    _.assign(this, methods);
  }
}

module.exports = SubscriptionMan;
