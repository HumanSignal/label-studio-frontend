require('ts-node/register');

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
  timeout: 240,
  tests: "./tests/*.test.js",
  output: "./output",
  helpers: {
    Playwright: {
      url: "http://localhost:3000",
      show: !headless,
      restart: 'context',
      waitForAction: headless ? 100 : 1200,
      windowSize: "1200x900",
      uniqueScreenshotNames: true,
      waitForNavigation: "networkidle",
      browser: "chromium",
      trace: true,
      video: true,
      keepVideoForPassedTests: false,
      keepTraceForPassedTests: false,
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
    AtTopbar: "./fragments/AtTopbar.js",
    ErrorsCollector: "./fragments/ErrorsCollector.js",
  },
  bootstrap: null,
  mocha: {
    bail: true,
    reporterOptions: {
      mochaFile: "output/result.xml",
    },
  },
  name: "label-studio-frontend",
  plugins: {
    retryFailedStep: {
      enabled: true,
      minTimeout: 3,
      defaultIgnoredSteps: [
        //'amOnPage',
        //'wait*',
        'send*',
        'execute*',
        'run*',
        'have*',
      ],
    },
    coverage: {
      enabled: headless,
      coverageDir: "output/coverage",
    },
    screenshotOnFail: {
      enabled: true,
    },
    ...recordVideo,
  },
};
