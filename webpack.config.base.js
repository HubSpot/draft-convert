const webpack = require('webpack');

module.exports = {
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    },
    {
      test: /\.json$/,
      loader: 'json-loader',
    }]
  },
  output: {
    library: 'DraftConvert',
    libraryTarget: 'umd'
  },
  externals: {
    'draft-js': 'Draft',
    'immutable': 'Immutable',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-dom/server': 'ReactDOMServer'
  }
};
