const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExtensionReloaderPlugin = require('webpack-extension-reloader');

const mode = process.env.NODE_ENV;
module.exports = {
  mode,
  devtool: 'inline-source-map',
  entry: {
    background: './plugin-src/background-scripts/background.js',
    app: './plugin-src/App.js',
    main: './plugin-src/main.js',
  },
  output: {
    publicPath: '.',
    path: resolve(__dirname, 'dist/'),
    filename: '[name].bundle.js',
    libraryTarget: 'umd',
  },
  plugins: [
    /***********************************************************************/
    /* By default the plugin will work only when NODE_ENV is "development" */
    /***********************************************************************/
    new ExtensionReloaderPlugin({
      manifest: resolve(__dirname, 'manifest.json'),
    }),

    new MiniCssExtractPlugin({ filename: 'style.css' }),
    new CopyWebpackPlugin([
      { from: './plugin-src/index.html' },
      { from: './manifest.json' },
      { from: './icons' },
    ]),
  ],
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        use: {
          loader: 'ts-loader',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              // require('@babel/preset-env'),
              require('@babel/preset-react'),
            ],
            plugins: [
              'babel-plugin-emotion',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[hash].[ext]',
              // What the fuck?!
              publicPath: (url) => url,
            },
          },
        ],
      },
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
    ],
  },
};
