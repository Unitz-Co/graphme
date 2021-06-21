const { GqlBuilder } = require('@unitz/gqlbuilder');
require('dotenv').config();
const { getClientSubs } = require('../__test__/client');

if (!console.snapshot) {
  console.snapshot = (...args) => {
    console.log(...args);
    expect({ args }).toMatchSnapshot();
  };
}

afterAll(() => {
  if (getClientSubs && getClientSubs.client) {
    getClientSubs.client.close();
  }
});
// change timeout
jest.setTimeout(60 * 1000);
