module.exports = () => {
  // require('dotenv').config();
      // config vars
  global.process.env.HASURA_GRAPHQL_ENDPOINT = 'https://mock-graphme.herokuapp.com/v1/graphql';
  global.process.env.HASURA_GRAPHQL_ADMIN_SECRET = 'admin';
  
};
