import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import filesize from 'rollup-plugin-filesize';
import visualizer from 'rollup-plugin-visualizer';
import autoExternal from 'rollup-plugin-auto-external';

import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'index.js',
    external: [],
    output: {
      name: 'graphme',
      exports: 'named',
      globals: { lodash: '_' },
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      autoExternal({
        builtins: true,
        dependencies: true,
        // packagePath: path.resolve('../../package.json'),
        peerDependencies: false,
      }),
      visualizer({
        filename: 'stats_viz.html',
      }),
      filesize(),
      nodeResolve({
        // skip: ['lodash']
      }),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
      }),
    ],
  },

  // and ES module (for bundlers) build.
  {
    input: 'index.js',
    external: [],
    output: {
      name: 'graphme',
      file: pkg.module,
      format: 'es',
    },
    plugins: [
      autoExternal({
        builtins: true,
        dependencies: true,
        // packagePath: path.resolve('../../package.json'),
        peerDependencies: false,
      }),
      visualizer({
        filename: 'stats_viz.html',
      }),
      filesize(),
      nodeResolve({
        // skip: ['lodash']
      }),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
      }),
    ],
  },

  // CommonJS (for Node)
  {
    input: 'index.js',
    external: [],
    output: {
      name: 'graphme',
      exports: 'named',
      file: pkg.main,
      format: 'cjs',
    },
    plugins: [
      autoExternal({
        builtins: true,
        dependencies: true,
        // packagePath: path.resolve('../../package.json'),
        peerDependencies: false,
      }),
      visualizer({
        filename: 'stats_viz.html',
      }),
      filesize(),
      nodeResolve({
        // skip: ['lodash']
      }),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'runtime',
      }),
    ],
  },
];
