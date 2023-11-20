const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");

const workingDirectory = process.env.WORK_DIR
  ? path.resolve(__dirname, process.env.WORK_DIR)
  : path.resolve(__dirname, "build");

if (workingDirectory) {
  console.log(`Working directory set as ${workingDirectory}`)
}

const customDistDir = !!process.env.WORK_DIR;

const DEFAULT_NODE_ENV = process.env.BUILD_MODULE ? "production" : process.env.NODE_ENV || "development";

const isDevelopment = DEFAULT_NODE_ENV !== "production";
const isTest = process.env.TEST_ENV === "true";

const BUILD = {
  NO_SERVER: !!process.env.BUILD_NO_MINIMIZATION || !!process.env.BUILD_NO_SERVER,
  NO_MINIMIZE: isDevelopment || !!process.env.BUILD_NO_MINIMIZATION,
  NO_CHUNKS: isDevelopment || !!process.env.BUILD_NO_CHUNKS,
  NO_HASH: isDevelopment || process.env.BUILD_NO_HASH,
  MODULE: !isDevelopment && !!process.env.BUILD_MODULE,
  DIAGNOSTICS: !!process.env.BUILD_DIAGNOSTICS,
};

const dirPrefix = {
  js: customDistDir ? "js/" : isDevelopment ? "" : "static/js/",
  css: customDistDir ? "css/" : isDevelopment ? "" : "static/css/",
};

const LOCAL_ENV = {
  NODE_ENV: DEFAULT_NODE_ENV,
  CSS_PREFIX: "lsf-",
  BUILD_NO_SERVER: BUILD.NO_SERVER,
};

console.log(LOCAL_ENV);

const babelOptimizeOptions = () => {
  return BUILD.NO_MINIMIZE
    ? {
      compact: false,
      cacheCompression: false,
    }
    : {
      compact: true,
      cacheCompression: true,
    };
};

const optimizer = () => {
  const result = {
    minimize: true,
    minimizer: [],
    runtimeChunk: true,
  };

  if (DEFAULT_NODE_ENV === 'production') {
    result.minimizer.push(
      new TerserPlugin({
        parallel: true,
      }),
      new CssMinimizerPlugin({
        parallel: true,
      }),
    )
  }

  if (BUILD.NO_MINIMIZE) {
    result.minimize = false;
    result.minimizer = undefined;
  }

  if (BUILD.NO_CHUNKS) {
    result.runtimeChunk = false;
    result.splitChunks = { cacheGroups: { default: false } }
  }

  return result;
};

const output = () => {
  const result = {
    filename: "[name]-[contenthash].js",
    chunkFilename: "[name]-[contenthash]-[id].chunk.js",
  };

  if (BUILD.NO_HASH) {
    result.filename = "[name].js";
    result.chunkFilename = "[name].chunk.js";
  }

  if (BUILD.MODULE) {
    result.library = "LabelStudio";
    result.libraryExport = "default";
    result.libraryTarget = "umd";
    result.globalObject = `(typeof self !== 'undefined' ? self : this)`;
  }

  result.filename = dirPrefix.js + result.filename;
  result.chunkFilename = dirPrefix.js + result.chunkFilename;

  return result;
};

const cssOutput = () => {
  const result = {
    filename: "[name]-[contenthash].css",
    chunkFilename: "[name]-[contenthash]-[id].chunk.css",
  };

  if (BUILD.NO_HASH) {
    result.filename = "[name].css";
    result.chunkFilename = "[name].[contenthash:8].chunk.css";
  }

  result.filename = dirPrefix.css + result.filename;
  result.chunkFilename = dirPrefix.css + result.chunkFilename;

  return result;
};

const babelLoader = {
  loader: "babel-loader",
  options: {
    presets: [
      [
        "@babel/preset-react",
        {
          runtime: "automatic",
        },
      ],
      "@babel/preset-typescript",
      [
        "@babel/preset-env",
        {
          targets: {
            browsers: ["last 2 Chrome versions"],
          },
        },
      ],
    ],
    plugins: [
      "react-hot-loader/babel",
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator",
      ...(
        isTest
          ? ["istanbul"]
          : []
      )
    ],
    ...babelOptimizeOptions(),
  },
};

const cssLoader = (withLocalIdent = true) => {
  const rules = [{
    loader: MiniCssExtractPlugin.loader,
  }];

  const localIdent = withLocalIdent
    ? LOCAL_ENV.CSS_PREFIX + "[local]"
    : "[local]";

  const cssLoader = {
    loader: "css-loader",
    options: {
      sourceMap: true,
      modules: {
        localIdentName: localIdent,
      },
    },
  };

  const postcssLoader = {
    loader: "postcss-loader",
    options: {
      sourceMap: true,
      postcssOptions: {
        plugins: [
          require("autoprefixer")({
            env: "last 4 version"
          })
        ]
      }
    }
  }

  const stylusLoader = {
    loader: "stylus-loader",
    options: {
      sourceMap: true,
      stylusOptions: {
        import: [
          path.resolve(__dirname, "./src/themes/default/colors.styl")
        ],
      },
    },
  };

  rules.push(cssLoader, postcssLoader, stylusLoader);

  return rules;
};

const devServer = () => {
  return (DEFAULT_NODE_ENV === 'development' && !BUILD.NO_SERVER) ? {
    devServer: {
      compress: true,
      port: process.env.LSF_PORT ?? 3000,
      static: {
        directory: path.join(__dirname, "public")
      },
      historyApiFallback: {
        index: "./public/index.html",
      },
      client: {
        overlay: false,
      }
    }
  } : {};
};

const plugins = [
  new Dotenv({
    path: "./.env",
    safe: true,
    silent: true,
    allowEmptyValues: true,
    defaults: "./.env.defaults",
  }),
  new EnvironmentPlugin(LOCAL_ENV),
  new MiniCssExtractPlugin({
    ...cssOutput(),
  }),
  new webpack.EnvironmentPlugin(LOCAL_ENV),
];

if (!BUILD.NO_SERVER) {
  plugins.push(
    new HtmlWebPackPlugin({
      title: "Label Studio Frontend",
      template: "public/index.html",
    })
  )
}

if (!BUILD.MODULE) {
  plugins.push(new webpack.ProgressPlugin());
}

if (BUILD.NO_CHUNKS) {
  babelLoader.options.plugins.unshift("babel-plugin-remove-webpack")

  plugins.push(new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 1,
  }));
}

if (BUILD.DIAGNOSTICS) {
  plugins.unshift(
    new SpeedMeasurePlugin()
  )
}

const sourceMap = isDevelopment ? "cheap-module-source-map" : "source-map";

module.exports = ({ withDevServer = true } = {}) => ({
  mode: DEFAULT_NODE_ENV || "development",
  target: process.env.NODE_ENV === "development" ? "web" : "browserslist",
  devtool: sourceMap,
  ...(withDevServer ? devServer() : {}),
  entry: {
    main: [
      path.resolve(__dirname, "src/index.js"),
    ],
  },
  output: {
    path: path.resolve(workingDirectory),
    filename: "main.js",
    ...output(),
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      worker_threads: false,
    }
  },
  plugins: withDevServer ? [
    ...plugins,
    // new webpack.HotModuleReplacementPlugin(),
  ] : plugins,
  experiments: {
    syncWebAssembly: true,
    asyncWebAssembly: true,
  },
  optimization: optimizer(),
  performance: {
    maxEntrypointSize: Infinity,
    maxAssetSize: 1000000,
  },
  stats: {
    errorDetails: true,
    logging: 'error',
    chunks: false,
    cachedAssets: false,
    orphanModules: false,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        enforce: "pre",
        exclude: /node_modules/,
        use: [babelLoader, "source-map-loader"],
      },
      {
        test: /\.tsx?$/i,
        enforce: "pre",
        exclude: /node_modules/,
        use: [babelLoader, "source-map-loader"],
      },
      {
        test: /\.css$/i,
        use: [{ loader: MiniCssExtractPlugin.loader }, "css-loader", "postcss-loader"],
      },
      {
        test: /\.styl$/i,
        exclude: /node_modules/,
        oneOf: [
          {
            test: /global\.styl$/,
            use: cssLoader(false),
          },
          {
            use: cssLoader(),
          },
        ],
      },
      {
        test: /\.scss$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
            },
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              importLoaders: 2,
              esModule: false,
              // exportType: "string",
              modules: {
                mode: "local",
                auto: true,
                namedExport: false,
                localIdentName: "[local]--[hash:base64:5]",
              },
            },
          },
          "postcss-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(webm|mov)$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve("url-loader"),
            options: {
              limit: 200000,
              encoding: "base64",
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              ref: true,
            },
          },
          "url-loader"
        ],
      },
      {
        test: /\.png$/,
        exclude: /node_modules/,
        use: [
          "url-loader"
        ],
      },
      {
        test: /\.xml$/,
        exclude: /node_modules/,
        loader: "url-loader",
      },
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          outputPath: dirPrefix.js, // colocate wasm with js
        }
      }
    ],
  },
});
