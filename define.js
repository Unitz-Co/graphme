const _ = require('lodash');
const container = require('./container');

const define = (instance) => {
  const modelDef = instance.getDefinition();
  // define fields
  modelDef.with('getFields', (fields) => {
    _.castArray(fields || []).map((fieldName) => {
      Object.defineProperty(instance, `${fieldName}`, {
        get() {
          if (instance.has(fieldName)) {
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
        },
        // enumerable: true,
      });
      return fieldName;
    });
  });

  // define nodes
  modelDef.with('getNodes', (nodes) => {
    const nodesMap = {};
    // const nodesMap = instance.props;
    _.castArray(nodes || []).map((item) => {
      let [nodeName, NodeModel] = item;
      NodeModel = container.resolve(NodeModel);

      Object.defineProperty(instance, `${nodeName}`, {
        get() {
          const resolveObjectRelationship = () => {
            // binding change from sourceKey to node forreignKey
            // resolve nodeData if possible
            if (!instance.has(nodeName)) {
              // init data at the node
            }
            const nodeData = instance.getRef(nodeName);
            nodesMap[nodeName] = new NodeModel(nodeData, instance.getContext());
            nodesMap[nodeName].getContext().set({ nodeName });
            return nodesMap[nodeName];
          };

          const resolveArrayRelationship = () => {
            // binding change from sourceKey to node forreignKey
            // resolve nodeData if possible
            if (!instance.has(nodeName)) {
              // init dataRef
              instance.set(nodeName, []);
            }
            const dataRef = instance.getRef(nodeName);
            const col = NodeModel(dataRef, instance.getContext());
            nodesMap[nodeName] = col;
            col.getContext().set({ nodeName });
            return nodesMap[nodeName];
          };

          if (!_.has(nodesMap, nodeName)) {
            if (NodeModel && NodeModel.isCollection) {
              return resolveArrayRelationship();
            } else {
              return resolveObjectRelationship();
            }
          }
          return nodesMap[nodeName];
        },
        set(value) {
          if (value instanceof NodeModel) {
          } else {
            if (NodeModel && NodeModel.isCollection) {
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
        },
        // enumerable: true,
      });
      return item;
    });
  });
};

module.exports = define;
