// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
const headless = process.env.HEADLESS;

module.exports.config = {
  timeout: 60 * 30, // Time out after 30 minutes
  tests: "./tests/*.test.js",
  output: "./output",
  helpers: {
    // Puppeteer: {
    //   url: "http://localhost:3000",
    //   show: !headless,
    //   waitForAction: headless ? 100 : 1200,
    //   windowSize: "1200x900",
    // },
    Playwright: {
      url: "http://localhost:3000",
      show: !headless,
      restart: 'session',
      timeout: 60000, // Action timeout after 60 seconds
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
      enabled: false,
      minTimeout: 1000,
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
  },
  require: ['ts-node/register'],
};
