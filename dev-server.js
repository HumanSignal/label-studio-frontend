const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");

const config = require("./webpack.config-builder")({
  withDevServer: true,
});

const port = 3000;

const compiler = webpack(config);
const server = new WebpackDevServer(compiler, config.devServer);

server.listen(port, "localhost", () => {
  console.log(`dev server listening on port ${port}`);
});
