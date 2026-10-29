import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

const globals = {
  'draft-js': 'Draft',
  immutable: 'Immutable',
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/server': 'ReactDOMServer',
};

const bundle = env => ({
  input: 'esm/index.js',
  external: Object.keys(globals),
  output: {
    globals,
    file:
      env === 'production'
        ? 'dist/draft-convert.min.js'
        : 'dist/draft-convert.js',
    format: 'umd',
    name: 'DraftConvert',
    sourcemap: env === 'production',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    env === 'production' && terser(),
  ].filter(Boolean),
});

export default [bundle('development'), bundle('production')];
