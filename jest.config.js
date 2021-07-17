module.exports = () => {
  return {
    verbose: true,
    rootDir: process.cwd(),
    globalSetup: './scripts/jestGlobalSetup.js',
    testEnvironment: './scripts/jestTestEnvironment.js',
    setupFilesAfterEnv: ['./scripts/jestTestSetup.js']
  };
};
