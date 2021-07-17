import graphme from '../../../index';

import Definition from '../Definition';

import GetAdvisorProfile from '../../gql/advisor_profile/GetAdvisorProfile.gql';

class AdvisorProfileModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'AdvisorProfile',
    schema: {
      id: String,
      display_name: String,
      ref_ctf_eid: String,
      advisor_id: String
    },
    foreignKeys: ['advisor_id'],
    key: 'id',

    baseQuery: GetAdvisorProfile,
    GQL_ACTIONS: {
      GET: 'advisor_profile_by_pk',
      INSERT: 'insert_advisor_profile_one',
      UPDATE: 'update_advisor_profile_by_pk',
      DELETE: 'delete_advisor_profile_by_pk'
    }
  });
}

graphme.model({ AdvisorProfileModel });

module.exports = AdvisorProfileModel;
