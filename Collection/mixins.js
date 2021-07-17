const _ = require('lodash');

const Context = require('../context');
const CacheMan = require('../CacheMan');
const hooks = require('../hooks');
const SubscriptionMan = require('../SubscriptionMan');
const utils = require('../utils');
const Streamable = require('../BaseModel/Streamable');

class CollectionMixins extends Streamable {
  constructor(Type, target, inst, ctx) {
    super();
    const getType = () => Type;
    // caching castType by item id
    const cacheInstance = new CacheMan({
      initer: item => new Type(item, this.getContext()),
      getId: (item) => {
        const keyName = Type.getDefinition().getKey();
        if (keyName && _.has(item, keyName)) {
          return _.get(item, keyName);
        }
      },
    });
    const castType = (item) => {
      if (item instanceof Type) {
        return item;
      }
      return cacheInstance.get(item);
    };

    this.inst = inst;
    this.target = target;
    this.Type = Type;

    this.getType = getType;

    this.castType = castType;

    // for argsstr
    let _args = '';
    this.setArgs = (args) => {
      _args = args;
      return this.target;
    };

    this.getArgs = () => {
      return _args;
    };

    this.updateArgs = (updater) => {
      if (!_.isFunction(updater)) {
        throw Error('UpdateArgs requires updater function as the input');
      }
      return this.setArgs(updater(this.getArgs()));
    };

    // selection props
    let _selections = '';

    this.setSelections = (selections) => {
      _selections = selections;
      return this.target;
    };

    this.getSelections = () => {
      return _selections;
    };

    this.updateSelection = (updater) => {
      if (!_.isFunction(updater)) {
        throw Error('UpdateSelection requires updater function as the input');
      }
      return this.setSelections(updater(this.getSelections()));
    };

    // create context chain
    const container = {
      context: new Context(ctx, { data: { type: 'Collection' } }),
    };
    this.setContext = (ctx) => {
      container.context = ctx;
    };
    this.getContext = () => {
      return container.context;
    };

    // selection props
    let _inited = false;

    this.setInited = () => {
      _inited = true;
      return this.target;
    };

    this.getInited = () => {
      return _inited;
    };

    /**
     * PromiseLike object
     *
     */
    Object.defineProperty(this, 'then', {
      value: (cb) => {
        const rtn = this.sync();
        // thenable only apply once
        this.then = null;
        if (rtn && rtn.then) {
          rtn.then(() => {
            cb(this.target);
          });
        } else {
          cb(rtn);
        }
      },
      writable: true,
      enumerable: false,
    });
  }

  // redefine all array methods here
  add(item) {
    const newItem = this.castType(item);
    this.target.push(newItem);
    return newItem;
  }

  _updateCollectionData(data) {
    const len = this.target.length;
    const arrData = _.castArray(data || []);
    const arrDataOld = this.toObject();

    _.map(arrData, (item, index) => {
      this.target[index] = item;
    });
    if (arrData.length < len) {
      this.target.splice(arrData.length, len);
    }
    // emit change on the collection instance
    if (_.isEqual(arrData, arrDataOld)) {
      this.emit('change');
    }
  }

  async save() {
    // apply saving method for all items in the collection
    await Promise.all(
      this.target.map(async (item) => {
        try {
          await item.saveIfDirty();
        } catch (err) {
          // console.log(err);
        }
      }),
    );
    return this.target;
  }

  async sync(fields = []) {
    let argsStr = this.getArgs();
    argsStr = argsStr ? `(${argsStr})` : '';
    const selectionsStr = this.getSelections();
    const parentModel = this.getContext().get('@model');
    const nodeName = this.getContext().get('nodeName');
    const NodeModel = this.Type;

    if (parentModel) {
      await parentModel.sync(
        _.castArray(fields || []).concat(
          [`${nodeName}${argsStr} ${NodeModel.getSelection()}`],
          selectionsStr ? [`${nodeName}${argsStr} { ${selectionsStr} }`] : [],
        ),
      );
      // update collection node after syncing
      const arrData = parentModel.getRef(nodeName);
      this._updateCollectionData(arrData);
      // remove thenable
      this.then = null;
      return this.target;
    }
    // self call query
    this.then = undefined;
    return this.target;


    // return this.target;
  }

  observe(field = '') {
    const NodeModel = this.getType();
    // build plan query for this object
    try {
      const [subsMan] = hooks.useMemo.call(this, 'subsMan', () => {
        const subsMan = new SubscriptionMan(this);
        this.on(
          'change',
          _.debounce(() => subsMan.scan()),
        );

        const ref = {
          fields: [],
          currObs: null,
          currQuery: '',
        };
        ref.fields.push(..._.castArray(field || []));
        ref.fields = _.uniq(ref.fields);
        // const target = this;

        const instance = this.getContext().get('@model');

        if (instance) {
          const nodeName = this.getContext().get('nodeName');
          // let argsStr = this.getArgs();
          // argsStr = argsStr ? `(${argsStr})` : '';

          const observer = instance.observe(`${nodeName}`);

          ref.currObs = observer.subscribe((data) => {
            this._updateCollectionData(data);
          });
        } else {
          const client = NodeModel.getDefinition().getClient();
          if (!client.subscribe) {
            throw Error('Client does not support subscribe method');
          }
          // no parent instance found, root collection query?
          const select = NodeModel.getFindQuery(this.getArgs(), this.getSelections());
          select.setOperation('subscription');

          // merge query
          const queryStr = select.toString();
          const prevQuery = ref.currQuery;

          const currQuery = queryStr;
          const observer = client.subscribe(currQuery);
          const prevObs = ref.currObs;
          if (!prevObs || prevQuery !== currQuery) {
            ref.currObs = observer.subscribe({
              next: (res) => {
                const { selectionPath } = select;
                const { data } = res;
                if (data) {
                  const rtnData = _.get(data, selectionPath);
                  this._updateCollectionData(rtnData);
                }
              },
            });
            ref.currQuery = currQuery;

            if (prevObs) {
              // unsubscribe prev Op
              prevObs.unsubscribe();
            }
          }
        }

        return [subsMan, ref];
      });
      return subsMan.subscription(field);
    } catch (err) {
      console.log('subscription failure for model:', this);
      throw err;
    }
  }

  toArray() {
    return this.inst;
  }

  toObject() {
    return this.toArray();
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

  getDefinition() {
    // @TODO: generate collection definition from model definition
    const Type = this.getType();
    const definition = Type.getDefinition();
    return definition;
  }
}

module.exports = CollectionMixins;
