const _ = require('lodash');

const graphme = require('@unitz/graphme');
 
const Definition = require('../Definition');

class UserProfileModel extends graphme.BaseModel {
  static DEFINITION = Definition.create({
    name: 'UserProfile',
    schema: {
      id: String,
      display_name: String,
      avatar_url: String,
      user_id: String,
    },
    foreignKeys: ['user_id'],
    key: 'id',

    baseQuery: 'GetUserProfile',
    GQL_ACTIONS: {
      GET: `user_profile_by_pk`,
      INSERT: `insert_user_profile_one`,
      UPDATE: `update_user_profile_by_pk`,
      DELETE: `delete_user_profile_by_pk`,
    },
  });

}

graphme.model({ UserProfileModel });

module.exports = UserProfileModel;
