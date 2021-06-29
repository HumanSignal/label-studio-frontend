const webpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config-builder")({
  withDevServer: false,
});

const port = 3000;

const options = {
  compress: true,
  hot: true,
  inline: true,
  public: `http://localhost:${port}`,
  contentBase: path.join(__dirname, "public"),
  historyApiFallback: {
    index: "./public/index.html",
  },
};

webpackDevServer.addDevServerEntrypoints(config, options);

const compiler = webpack(config);
const server = new webpackDevServer(compiler, options);

server.listen(port, "localhost", () => {
  console.log(`dev server listening on port ${port}`);
});
