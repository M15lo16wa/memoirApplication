const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ensure resolve exists
      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
      }

      // Add process polyfill and other fallbacks
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "util": require.resolve("util/"),
        "zlib": require.resolve("browserify-zlib"),
        "stream": require.resolve("stream-browserify"),
        "url": require.resolve("url/"),
        "crypto": require.resolve("crypto-browserify"),
        "assert": require.resolve("assert/"),
        "buffer": require.resolve("buffer/"),
        "fs": false,
        "net": false,
        "tls": false,
        "path": false,
        "os": false,
      };

      // Ensure plugins array exists
      if (!webpackConfig.plugins) {
        webpackConfig.plugins = [];
      }

      // Add necessary plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        })
      );

      // Handle module resolution with proper alias
      if (!webpackConfig.resolve.alias) {
        webpackConfig.resolve.alias = {};
      }
      
      // Use the process package directly
      webpackConfig.resolve.alias['process'] = require.resolve('process/browser');
      webpackConfig.resolve.alias['process/browser'] = require.resolve('process/browser');

      // Add extensions for better module resolution
      if (!webpackConfig.resolve.extensions) {
        webpackConfig.resolve.extensions = [];
      }
      
      if (!webpackConfig.resolve.extensions.includes('.js')) {
        webpackConfig.resolve.extensions.push('.js', '.jsx', '.ts', '.tsx');
      }

      return webpackConfig;
    }
  }
};
