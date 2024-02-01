const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");

const config = require("./webpack.config-builder")({
  withDevServer: true,
});

const port = config.devServer?.port || 3000;

config.entry.main.unshift(
  `webpack-dev-server/client?http://localhost:${config.devServer.port}/`,
  `webpack/hot/dev-server`,
);

const compiler = webpack(config);
const server = new WebpackDevServer(config.devServer, compiler);

(async () => {
  await server.start();
  console.log(`Dev server is listening on port ${port}`);
})();
