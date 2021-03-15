module.exports = () => {
  // require('dotenv').config();
      // config vars
  global.process.env.HASURA_GRAPHQL_ENDPOINT = 'http://localhost:28080/v1/graphql';
  global.process.env.HASURA_GRAPHQL_ADMIN_SECRET = 'admin';
  
};
