const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('./webpack.config-builder')({
  withDevServer: true,
});

config.entry.main.unshift(
  `webpack-dev-server/client?http://localhost:${config.devServer.port}/`,
  'webpack/hot/dev-server',
);

const compiler = webpack(config);
const server = new WebpackDevServer(config.devServer, compiler);

server.startCallback(() => {
  console.log(`dev server listening on port ${config.devServer.port}`);
});
