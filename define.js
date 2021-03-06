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
          return instance.set(fieldName, value);
        }
      });
    });
  }

  // define nodes
  if(_.isFunction(modelDef.getNodes)) {
    const nodesMap = {};
    _.castArray(modelDef.getNodes() || []).map(item => {
      let [nodeName, NodeModel, using] = item;
      NodeModel = container.resolve(NodeModel);

      Object.defineProperty(instance, nodeName, {
        get() {

          const applyObjectRelationship = (fromModel, toModel) => {
            const mapping = _.get(using, 'column_mapping');
            if(mapping) {
              _.map(mapping, (fKey, lKey) => {
                const lVal = fromModel.get(lKey);
                toModel.set(fKey, lVal);
                console.log('mapping', fKey, lKey, lVal);
                fromModel.on('change', (val, key) => ((key === lKey) && toModel.set(val)));
              });
            }

          }

          const applyArrayRelationship = (fromModel, toModel) => {

          };

          const resolveObjectRelationship = () => {
            // binding change from sourceKey to node forreignKey
            // resolve nodeData if possible
            if(instance.has(nodeName)) {
              const nodeData = instance.get(nodeName);
              nodesMap[nodeName] = NodeModel.fromData(nodeData);
              applyObjectRelationship(instance, nodesMap[nodeName]);
              return nodesMap[nodeName];
            } else {
              const rtn = new Promise(async (res) => {
                await instance.sync([`${nodeName} {${instance.getKey()}}`]);
                const nodeData = instance.get(nodeName);
                nodesMap[nodeName] = NodeModel.fromData(nodeData);
                applyObjectRelationship(instance, nodesMap[nodeName]);
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
              const col = NodeModel();
              const Model = col.getType();
              arrData.forEach((nodeData) => {
                const nodeInstance = Model.fromData(nodeData);
                applyArrayRelationship(instance, nodeInstance);
                col.push(nodeInstance);
              });
              nodesMap[nodeName] = col;
              return nodesMap[nodeName];
            } else {
              const col = NodeModel();
              nodesMap[nodeName] = col;
              const Model = col.getType();

              col.on('onSync', async () => {
                let argsStr = col.getArgs();
                argsStr = argsStr ? `(${argsStr})` : '';               
                await instance.sync([`${nodeName}${argsStr} {${instance.getKey()}}`]);
                const arrData = _.castArray(instance.get(nodeName));
                // console.log('arrDataarrDataarrDataarrData', arrData);
                arrData.forEach((nodeData, index) => {
                  const nodeInstance = Model.fromData(nodeData);
                  applyArrayRelationship(instance, nodeInstance);
                  col[index] = nodeInstance;
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
          if(value instanceof nodeDef) {
          } else {
            value = nodeDef.fromData(value);
          }
          nodesMap[nodeName] = value;
          // sync data from value to parent node
          instance.set(nodeName, value.get());
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
