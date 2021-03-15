const { GraphQLClient } = require('graphql-request');
const _ = require('lodash');
const { gql } = require('graphql-request');
const { SubscriptionClient } = require('graphql-subscriptions-client');

const WebSocket = require('ws');

if(global) {
  global.WebSocket = WebSocket;
}

const getOptions = _.memoize(() => {
  const options = {
    endpoint: process.env.HASURA_GRAPHQL_ENDPOINT,
    adminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
    debug: true,
  }
  return options;
});

const getClientSubs = _.memoize((endpoint, opts = {}) => {
  const options = getOptions();

  endpoint = endpoint || options.endpoint;

  const adminSecret = _.get(options, 'adminSecret'); 
  const WS_ENDPONT = `${endpoint}`.replace(/^http/, 'ws');

  // set up the client, which can be reused
  const client = new SubscriptionClient(WS_ENDPONT, {
    reconnect: true,
    lazy: true, // only connect when there is a query
    connectionCallback: error => {
      error && console.error(error)
    },
    connectionParams: {
      headers: {
        'x-hasura-admin-secret': adminSecret,
      },
    }
  });  
  return client;
});


exports.getClient = _.memoize((endpoint, opts = {}) => {
  const options = getOptions();

  endpoint = endpoint || options.endpoint;
  const adminSecret = _.get(options, 'adminSecret');

  const client = new GraphQLClient(endpoint, {
    headers: {
      'x-hasura-admin-secret': adminSecret,
    },
  });
  // check for debug mode
  if(_.get(options, 'debug', true)) {
    return new Proxy(client, {
      get(obj, prop) {
        if(prop === 'request') {
          return function(...args) {
            console.log('request with args:', ...args);
            return obj.request(...args);
          }
        }
        if(prop === 'subscribe') {
          return function(...args) {
            const [query] = args;
            console.log('susbcribe with query:', query);
            return getClientSubs().request({ query });
          }
        }
      }
    });
  }
  return client;
});

exports.gql = gql;
