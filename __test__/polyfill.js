const _ = require('lodash');
const chalk = require('chalk');

const testPolyFill = () => {
  const allTest = {};
  if (global) {
    global.test = (testName, testFn) => {
      _.set(allTest, testName, testFn);
    };
    global.runTest = async () => {
      const testKeys = Object.keys(allTest);
      for (let index = 0; index < testKeys.length; index++) {
        const testName = testKeys[index];
        const test = allTest[testName];
        if (test) {
          console.log(chalk.blue(`[************* Running test [${testName}] *************]`));
          await test.call();
        }
      }
    };

    global.describe = async (name, cb) => {
      console.log(chalk.blue(`[************* Running testsute [${name}] *************]`));
      await cb();
    };

    console.snapshot = (...args) => {
      console.log(...args);
      if (expect) {
        expect({ args }).toMatchSnapshot();
      }
    };
  }
  const runner = {
    load: (fn) => {
      fn();
      return runner;
    },
    runTest: () => {
      global.runTest();
    }
  };
  return runner;
};

module.exports = testPolyFill;
