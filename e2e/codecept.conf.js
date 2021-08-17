// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
const headless = process.env.HEADLESS;

// codecept can make screenshot on every step and create html
// with "gif" and annotations. possible usage:
// GIF=true yarn e2e:test:headless e2e/present_feature_test.js
const recordVideo = process.env.GIF
  ? {
    stepByStepReport: {
      enabled: true,
      deleteSuccessful: false,
    },
  }
  : null;

// eslint-disable-next-line no-undef
exports.config = {
  tests: "./**/*.test.js",
  output: "./output",
  helpers: {
    Puppeteer: {
      url: "http://localhost:3000",
      show: !headless,
      waitForAction: headless ? 100 : 1200,
      windowSize: "1200x900",
    },
    MouseActions: {
      require: "./helpers/MouseActions.js",
    },
    Selection: {
      require: "./helpers/Selection.js",
    },
  },
  include: {
    I: "./steps_file.js",
    LabelStudio: "./fragments/LabelStudio.js",
    AtImageView: "./fragments/AtImageView.js",
    AtAudioView: "./fragments/AtAudioView.js",
    AtRichText: "./fragments/AtRichText.js",
    AtSidebar: "./fragments/AtSidebar.js",
    AtLabels: "./fragments/AtLabels.js",
    AtSettings: "./fragments/AtSettings.js",
    ErrorsCollector: "./fragments/ErrorsCollector.js",
  },
  bootstrap: null,
  mocha: {},
  name: "label-studio-frontend",
  plugins: {
    retryFailedStep: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
    ...recordVideo,
  },
};
