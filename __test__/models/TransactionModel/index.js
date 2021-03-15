const _ = require('lodash');

const graphme = require('@unitz/graphme');

const Definition = require('../Definition');

class TransactionModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'Transaction',
    schema: {
      id: String,
      advisor_id: String,
      user_id: String,
      session_id: String,
    },
    nodes: [
      ['advisor', 'AdvisorModel', { column_mapping: { advisor_id: 'id' } }],
      ['user', 'UserModel', { column_mapping: { user_id: 'id' } }],
    ],
    key: 'id',

    getForeignKeys: ['advisor_id', 'user_id'],

    foreignKeysMapping: {
      advisor_id: ['Advisor', 'id'],
      user_id: ['user', 'id'],
    },

    baseQuery: 'GetTransaction',

    GQL_ACTIONS: _.memoize(() => {
      return {
        GET: `transaction_by_pk`,
        INSERT: `insert_transaction_one`,
        INSERT_MANY: `insert_transaction`,
        UPDATE: `update_transaction_by_pk`,
        DELETE: `delete_transaction_by_pk`,
        DELETE_MANY: `delete_transaction`,
      };
    })(),
  });
}

graphme.model({ TransactionModel });

module.exports = TransactionModel;
