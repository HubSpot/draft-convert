const webpack = require('webpack');

module.exports = {
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }]
  },
  output: {
    library: 'DraftConvert',
    libraryTarget: 'umd'
  },
  externals: {
    'draft-js': 'DraftPublic',
    'immutable': 'Immutable'
  }
};
