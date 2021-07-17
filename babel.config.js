const path = require('path');
const _ = require('lodash');

const config = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          browsers: 'ie >= 11'
        }
      }
    ]
  ],
  plugins: [
    'macros',
    [
      'import-graphql',
      {
        nodePath: path.resolve(process.cwd(), '../../modules')
      }
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true
      }
    ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread'
  ],
  env: {
    test: {
      presets: [['@babel/preset-env']]
    }
  }
};

module.exports = config;
