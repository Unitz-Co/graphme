import _ from 'lodash';
import graphme from '../../../index';

import Definition from '../Definition';

import GetAdvisorPresence from '../../gql/advisor_presence/GetAdvisorPresence.gql';

class AdvisorPresenceModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'AdvisorPresence',
    schema: {
      id: String,
      status: String,
      advisor_id: String,
    },
    foreignKeys: ['advisor_id'],
    key: 'id',

    baseQuery: GetAdvisorPresence,
    GQL_ACTIONS: {
      GET: `advisor_presence_by_pk`,
      INSERT: `insert_advisor_presence_one`,
      UPDATE: `update_advisor_presence_by_pk`,
      DELETE: `delete_advisor_presence_by_pk`,
    },
  });
}

graphme.model({ AdvisorPresenceModel });

module.exports = AdvisorPresenceModel;
