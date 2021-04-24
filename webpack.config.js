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
    'draft-js': 'Draft',
    immutable: 'Immutable',
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/server': 'ReactDOMServer',
  },
};

module.exports = [
  {
    ...baseConfig,
    mode: 'development',
    devtool: 'none',
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
