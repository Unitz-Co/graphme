import _ from 'lodash';
import graphme from '../../../index';

import Definition from '../Definition';

import GetTransaction from '../../gql/transaction/GetTransaction.gql';

graphme.GqlBuilder.loadDocument({ GetTransaction });

class TransactionModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'Transaction',
    schema: {
      id: String,
      advisor_id: String,
      user_id: String,
      session_id: String
    },
    nodes: [
      ['advisor', 'AdvisorModel', { column_mapping: { advisor_id: 'id' } }],
      ['user', 'UserModel', { column_mapping: { user_id: 'id' } }]
    ],
    key: 'id',

    getForeignKeys: ['advisor_id', 'user_id'],

    foreignKeysMapping: {
      advisor_id: ['Advisor', 'id'],
      user_id: ['user', 'id']
    },

    baseQuery: 'GetTransaction',

    GQL_ACTIONS: _.memoize(() => {
      return {
        GET: 'transaction_by_pk',
        INSERT: 'insert_transaction_one',
        INSERT_MANY: 'insert_transaction',
        UPDATE: 'update_transaction_by_pk',
        DELETE: 'delete_transaction_by_pk',
        DELETE_MANY: 'delete_transaction'
      };
    })()
  });
}

graphme.model({ TransactionModel });

module.exports = TransactionModel;
