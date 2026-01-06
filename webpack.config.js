const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    background: './src/background.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/view.html', to: 'view.html' },
        { from: 'src/settings.html', to: 'settings.html' },
        { from: 'src/view.js', to: 'view.js' },
        { from: 'src/settings.js', to: 'settings.js' },
        { from: 'src/style.css', to: 'style.css' },
        
        { from: 'src/storage.js', to: 'storage.js' },
        { from: 'src/hook.js', to: 'hook.js' },

        { from: 'src/icons', to: 'icons' },
        { from: 'src/lib', to: 'lib' }
      ],
    }),
  ],
};
