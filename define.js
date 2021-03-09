const _ = require('lodash');
const container = require('./container');

const define = (instance) => {
  const modelDef = instance.getDefinition();
  // define fields
  if(_.isFunction(modelDef.getFields)) {
    _.castArray(modelDef.getFields() || []).map(fieldName => {
      Object.defineProperty(instance, fieldName, {
        get() {
          if(instance.has(fieldName)) {
            return instance.get(fieldName);
          } else {
            // make query to fetch the field and return the promise
            return new Promise(async (res) => {
              await instance.sync([fieldName]);
              res(instance.get(fieldName));
            });
          }
        },
        set(value) {
          // mark model as dirty
          instance.setState({ dirty: true });
          return instance.set(fieldName, value);
        }
      });
    });
  }

  // define nodes
  if(_.isFunction(modelDef.getNodes)) {
    const nodesMap = {};
    // const nodesMap = instance.props;
    _.castArray(modelDef.getNodes() || []).map(item => {
      let [nodeName, NodeModel, using] = item;
      NodeModel = container.resolve(NodeModel);

      Object.defineProperty(instance, nodeName, {
        get() {

          const resolveObjectRelationship = () => {
            // binding change from sourceKey to node forreignKey
            // resolve nodeData if possible
            if(instance.has(nodeName)) {
              const nodeData = instance.get(nodeName);
              nodesMap[nodeName] = new NodeModel(nodeData, instance.getContext());
              nodesMap[nodeName].getContext().set({ nodeName });
              return nodesMap[nodeName];
            } else {
              const rtn = new Promise(async (res) => {
                await instance.sync([`${nodeName} ${NodeModel.getSelection()}`]);
                const nodeData = instance.get(nodeName);
                nodesMap[nodeName] = new NodeModel(nodeData, instance.getContext());
                nodesMap[nodeName].getContext().set({ nodeName });
                res(nodesMap[nodeName]);
              });
              return rtn;  
            }
          }

          const resolveArrayRelationship = () => {
            // binding change from sourceKey to node forreignKey
            // resolve nodeData if possible
            if(instance.has(nodeName)) {
              const arrData = _.castArray(instance.get(nodeName));
              const col = NodeModel(arrData, instance.getContext());
              nodesMap[nodeName] = col;
              nodesMap[nodeName].getContext().set({ nodeName });

              return nodesMap[nodeName];
            } else {
              const col = NodeModel([], instance.getContext());
              nodesMap[nodeName] = col;
              nodesMap[nodeName].getContext().set({ nodeName });

              col.on('onSync', async () => {
                let argsStr = col.getArgs();
                argsStr = argsStr ? `(${argsStr})` : '';
                await instance.sync([`${nodeName}${argsStr} ${NodeModel.getSelection()}`]);
                const arrData = _.castArray(instance.get(nodeName));
                // load the collection with new arrData
                col.splice(0, col.length);
                arrData.forEach((nodeData, index) => {
                  col[index] = nodeData;
                });
              });
              return nodesMap[nodeName];
            }
          }

          if(!_.has(nodesMap, nodeName)) {
            if(NodeModel && NodeModel.isCollection) {
              return resolveArrayRelationship();
            } else {
              return resolveObjectRelationship();
            }
          }
          return nodesMap[nodeName];
        },
        set(value) {
          if(value instanceof NodeModel) {
          } else {
            if(NodeModel && NodeModel.isCollection) {
              const col = NodeModel([], instance.getContext());
              _.castArray(value || []).forEach((nodeData, index) => {
                col[index] = nodeData;
              });
              value = col;
              // instance.set(nodeName, col);
            } else {
              value = NodeModel.fromData(value, instance.getContext());
              // sync data from value to parent node
              instance.set(nodeName, value.get());
            }
          }
          nodesMap[nodeName] = value;
          return nodesMap[nodeName];
        }
      });
    });
  }

  // each model must have getId method to use as primary key in query
  Object.defineProperty(instance, 'getKey', {
    get() {
      return () => {
        const idKey = 'id'; // from modelDef config also
        return idKey;
      };
    }
  });
  Object.defineProperty(instance, 'getId', {
    get() {
      return () => {
        const idKey = instance.getKey();
        return instance.get(idKey);
      };
    }
  });
}

module.exports = define;
