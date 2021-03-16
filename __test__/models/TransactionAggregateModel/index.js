import _ from 'lodash';
import graphme from '../../../index';

import Definition from '../Definition';

import GetTransactionAggregate from '../../gql/transaction/GetTransactionAggregate.gql';

class TransactionAggregateCount extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'TransactionAggregateCount',
    schema: {
      count: Number,
    },
    nodes: [
      ['min', 'TransactionModel'],
      ['max', 'TransactionModel'],
    ],
    baseQuery: GetTransactionAggregate,
    selection: `{ count }`,

    GQL_ACTIONS: {
      GET: `aggregate`,
    },
  });
}

graphme.model({ TransactionAggregateCount });

class TransactionAggregateModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'TransactionAggregate',
    schema: {
      // aggregate: {
      //   count: Number,
      //   min: {
      //     id: String,
      //   },
      //   min: {
      //     id: String,
      //   },
      // },
      // nodes: [{
      //   id: String,
      //   advisor_id: String,
      //   user_id: String,
      //   session_id: String,  
      // }],
    },
    nodes: [
      ['nodes', 'TransactionModel.Collection', { usePlanSync: true }],
      // ['aggregate', 'TransactionAggregateCount', { usePlanSync: true }],
    ],
    key: '',
    baseQuery: GetTransactionAggregate,
    selection: `{
      nodes {
        id
      }
    }`,

    GQL_ACTIONS: {
      GET: `transaction_aggregate`,
    },
  });
}

graphme.model({ TransactionAggregateModel });

module.exports = TransactionAggregateModel;
