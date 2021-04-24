const library = 'DraftConvert';

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'draft-js': {
      commonjs: 'draft-js',
      commonjs2: 'draft-js',
      amd: 'draft-js',
      root: 'Draft'
    },
    immutable:  {
      commonjs: 'immutable',
      commonjs2: 'immutable',
      amd: 'immutable',
      root: 'Immutable'
    },
    react:  {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React'
    },
    'react-dom/server': {
      commonjs: 'react-dom/server',
      commonjs2: 'react-dom/server',
      amd: 'react-dom/server',
      root: 'ReactDOMServer'
    },
  },
};

module.exports = [
  {
    ...baseConfig,
    mode: 'development',
    output: {
      filename: 'draft-convert.js',
      library,
      libraryTarget: 'umd',
    },
  },
  {
    ...baseConfig,
    mode: 'production',
    output: {
      filename: 'draft-convert.min.js',
      library,
      libraryTarget: 'umd',
    },
  },
];
