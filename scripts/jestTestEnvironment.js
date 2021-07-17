const NodeEnvironment = require('jest-environment-node'); // for server node apps
// const NodeEnvironment = require('jest-environment-jsdom'); // for browser js apps

class TestEnvironment extends NodeEnvironment {
  // constructor(config, context) {
  //   super(config, context);
  // }

  async setup() {
    await super.setup();

    this.global.sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  }
}

module.exports = TestEnvironment;
