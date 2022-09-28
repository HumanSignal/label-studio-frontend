// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
const headless = process.env.HEADLESS;

module.exports.config = {
  timeout: 60 * 30, // Time out after 30 minutes
  tests: "./tests/**/*.test.js",
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
      restart: 'context',
      timeout: 60000, // Action timeout after 60 seconds
      waitForAction: headless ? 100 : 1200,
      windowSize: "1200x900",
      waitForNavigation: "networkidle",
      browser: "chromium",
      trace: false,
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
    AtParagraphs: "./fragments/AtParagraphs.js",
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
      minTimeout: 100,
      defaultIgnoredSteps: [
        //'amOnPage',
        //'wait*',
        'send*',
        'execute*',
        'run*',
        'have*',
      ],
    },
    // For the future generations
    // coverage: {
    //   enabled: true,
    //   coverageDir: "output/coverage",
    // },
    screenshotOnFail: {
      enabled: true,
    },
  },
  require: ['ts-node/register'],
};
