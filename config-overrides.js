module.exports = function override(config, env) {
  if (process.env.BUILD_NO_MINIMIZATION) {
    config.optimization.minimizer = undefined;
    const rules = config.module.rules.find(rule => rule.oneOf);
    if (rules) {
      const jsRule = rules.oneOf.find(rule => String(rule.test).includes("jsx"));
      if (jsRule) {
        const options = jsRule.options;
        options.compact = false;
        options.cacheCompression = false;
      }
    }
  }

  if (process.env.BUILD_NO_CHUNKS) {
    config.optimization.runtimeChunk = false;
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
  }

  if (process.env.BUILD_NO_HASH) {
    config.output.filename = "static/js/[name].js";
    config.output.chunkFilename = "static/js/[name].chunk.js";
    const CssPlugin = config.plugins.find(p => p.constructor.name.includes("Css"));
    if (CssPlugin) {
      CssPlugin.options.filename = "static/css/[name].css";
      CssPlugin.options.chunkFilename = "static/css/[name].[contenthash:8].chunk.css";
    }
  }

  if (process.env.BUILD_MODULE) {
    config.output.library = "LabelStudio";
    config.output.libraryExport = "default";
    config.output.libraryTarget = "umd";
  }

  return config;
};
