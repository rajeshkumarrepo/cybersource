const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
module.exports = function (env) {
    console.log("env = ", env);
    return {
        target: 'node',
        externals: [nodeExternals()],
        entry: {
            'index': './bin/www',
        },
        output: {
            path: path.join(__dirname, 'build'),
            filename: '[name].bundle.js',
            libraryTarget: 'commonjs2'
        }
    }
}