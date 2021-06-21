import _ from 'lodash';
import graphme from '../../../index';

import Definition from '../Definition';

import GetUser from '../../gql/user/GetUser.gql';

const UserProfileModel = require('../UserProfileModel');
const UserPresenceModel = require('../UserPresenceModel');

class UserModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'User',
    schema: {
      id: String,
      is_active: Boolean,
    },
    nodes: [
      ['profile', 'UserProfileModel', { column_mapping: { id: 'user_id' } }],
      ['presence', 'UserPresenceModel', { column_mapping: { id: 'user_id' } }],
      ['transactions', 'TransactionModel.Collection', { column_mapping: { id: 'user_id' } }],
      ['transactions_aggregate', 'TransactionAggregateModel', { column_mapping: { id: 'user_id' }, usePlanSync: true }],
    ],
    key: 'id',

    baseQuery: GetUser,

    GQL_ACTIONS: {
      FIND: `user`,
      GET: `user_by_pk`,
      INSERT: `insert_user_one`,
      UPDATE: `update_user_by_pk`,
      DELETE: `delete_user_by_pk`,
    },
  });
}

graphme.model('UserModel', UserModel);

module.exports = UserModel;
