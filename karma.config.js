const { web } = require('webpack');
const webpack = require('./webpack.config.js');
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    files: [
      'src/**/*.test.js',
      'src/**/*.test.jsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx'
    ],
    preprocessors: {
      'src/**/*.test.js': ['webpack'],
      'src/**/*.test.jsx': ['webpack'],
      'src/**/*.test.ts': ['webpack'],
      'src/**/*.test.tsx': ['webpack']
    },

    webpack: {
        ...webpack.config,
        mode: 'development',
        resolve: {
            ...webpack.config.resolve.alias: {
                ...webpack.config.resolve.alias,
    },

    //Navegadores
    browsers:[' chrome'],
    reporters: ['progress'],
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: proccess.env.CI === 'true',
    concurrency: Infinity,
  });
}