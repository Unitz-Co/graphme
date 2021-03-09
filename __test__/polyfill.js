const _ = require('lodash');
const chalk = require('chalk');

const testPolyFill = () => {
  const allTest = {};
  if(global) {
    global.test = (testName, testFn) => {
      _.set(allTest, testName, testFn);
    }
    global.runTest = async () => {
      const testKeys = Object.keys(allTest);
      for(let index = 0; index < testKeys.length; index++) {
        const testName = testKeys[index];
        const test = allTest[testName];
        if(test) {
          console.log(chalk.green(`[************* Running test [${testName}] *************]`));
          await test.call();
        }
      }
    }
  }
  const runner = {
    load: (fn) => {
      fn();
      return runner;
    },
    runTest: () => {
      runTest();
    }
  }
  return runner;
};

module.exports = testPolyFill;
