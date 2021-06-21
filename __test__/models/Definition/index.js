import graphme from '../../../index';

const hasuraClient = require('../../client');

class Definition {
  static create(config) {
    return graphme.Definition.create({
      ...config,
      getClient: hasuraClient.getClient,
    });
  }
}

module.exports = Definition;
