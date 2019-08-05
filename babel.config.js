module.exports = {
  presets: ['@babel/env', '@babel/react'],
  plugins: ['@babel/transform-runtime'],
  env: {
    esm: {
      presets: [['@babel/env', { modules: false }]],
      plugins: [['@babel/transform-runtime', { useESModules: true }]]
    }
  }
};
