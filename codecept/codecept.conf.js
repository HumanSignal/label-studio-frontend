const { setHeadlessWhen } = require("@codeceptjs/configure");

const headless = process.env.HEADLESS;

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(headless);

exports.config = {
  tests: "./*_test.js",
  output: "./output",
  helpers: {
    Puppeteer: {
      url: "http://localhost:3000",
      show: !headless,
      waitForAction: headless ? 100 : 1200,
      windowSize: "1200x900",
    },
  },
  include: {
    I: "./steps_file.js",
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
    // stepByStepReport: {
    //   enabled: true,
    //   deleteSuccessful: false
    // }
  },
};
