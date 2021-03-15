import _ from 'lodash';
import graphme from '@unitz/graphme';

import Definition from '../Definition';

import GetAdvisor from '../../gql/advisor/GetAdvisor.gql';

import AdvisorProfileModel from '../AdvisorProfileModel';

// const AdvisorPresenceModel = require('../AdvisorPresenceModel');

class AdvisorModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'Advisor',
    schema: {
      id: String,
      is_active: Boolean,
      created_at: Date,
    },
    nodes: [
      ['profile', 'AdvisorProfileModel', { column_mapping: { id: 'advisor_id' } }],
      // ['presence', 'AdvisorPresenceModel', { column_mapping: { id: 'advisor_id' } }],
      // ['transactions', 'TransactionModel.Collection', { column_mapping: { id: 'advisor_id' } }],
      // ['transactions_aggregate', 'TransactionAggregateModel', { column_mapping: { id: 'advisor_id' }, usePlanSync: true }],
      // ['transactions_aggregate.nodes', 'TransactionModel.Collection', { usePlanSync: true }],
      // ['transactions_aggregate.aggregate', 'TransactionAggregateCount', { usePlanSync: true }],
      // ['transactions_aggregate.aggregate.count', Number, { usePlanSync: true }],
      // ['transactions_aggregate.aggregate.min', 'TransactionModel', { usePlanSync: true }],
    ],
    key: 'id',

    baseQuery: GetAdvisor,

    GQL_ACTIONS: {
      FIND: `advisor`,
      GET: `advisor_by_pk`,
      INSERT: `insert_advisor_one`,
      UPDATE: `update_advisor_by_pk`,
      DELETE: `delete_advisor_by_pk`,
    },    
  });
}

graphme.model('AdvisorModel', AdvisorModel);

export default AdvisorModel;

