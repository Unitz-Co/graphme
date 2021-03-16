import _ from 'lodash';
import graphme from '@unitz/graphme';

import Definition from '../Definition';

import GetUserPresence from '../../gql/user_presence/GetUserPresence.gql';

class UserPresenceModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'UserPresence',
    schema: {
      id: String,
      status: String,
      user_id: String,
    },
    foreignKeys: ['user_id'],
    key: 'id',

    baseQuery: GetUserPresence,
    GQL_ACTIONS: {
      GET: `user_presence_by_pk`,
      INSERT: `insert_user_presence_one`,
      UPDATE: `update_user_presence_by_pk`,
      DELETE: `delete_user_presence_by_pk`,
    },
  });
}

graphme.model({ UserPresenceModel });

module.exports = UserPresenceModel;
