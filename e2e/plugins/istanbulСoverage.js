const fs = require('fs');
const path = require('path');

const { recorder, event, output } = require('codeceptjs');
const Container = require('codeceptjs/lib/container');
const { clearString } = require('codeceptjs/lib/utils');


const defaultConfig = {
  coverageDir: 'output/coverage',
  uniqueFileName: true,
};

const supportedHelpers = ['Puppeteer', 'Playwright'];

function buildFileName(test, uniqueFileName) {
  let fileName = clearString(test.title);

  // This prevent data driven to be included in the failed screenshot file name
  if (fileName.indexOf('{') !== -1) {
    fileName = fileName.substr(0, fileName.indexOf('{') - 3).trim();
  }

  if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') {
    fileName = clearString(`${test.title}_${test.ctx.test.title}`);
  }

  if (uniqueFileName) {
    const uuid = test.uuid
      || test.ctx.test.uuid
      || Math.floor(new Date().getTime() / 1000);

    fileName = `${fileName.substring(0, 10)}_${uuid}.coverage.json`;
  } else {
    fileName = `${fileName}.coverage.json`;
  }

  return fileName;
}

/**
 * Dumps code coverage from Playwright/Puppeteer after every test.
 *
 * #### Configuration
 *
 *
 * ```js
 * plugins: {
 *    istanbulCoverage: {
 *      require: "./path/to/istanbulCoverage"
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `coverageDir`: directory to dump coverage files
 * * `uniqueFileName`: generate a unique filename by adding uuid
 */
module.exports = function(config) {
  const helpers = Container.helpers();
  let helper;

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
    }
  }

  if (!helper) {
    console.error('Coverage is only supported in Puppeteer, Playwright');
    return; // no helpers for screenshot
  }

  const options = Object.assign(defaultConfig, helper.options, config);

  event.dispatcher.on(event.all.before, async () => {
    output.debug('*** Collecting istanbul coverage for tests ****');
  });

  // Save coverage data after every test run
  event.dispatcher.on(event.test.after, async (test) => {
    recorder.add(
      'saving coverage',
      async () => {
        try {
          const coverageInfo = await helper.page.evaluate(() => {
            return window.__coverage__;
          });

          const coverageDir = path.resolve(
            process.cwd(),
            options.coverageDir,
          );

          if (!fs.existsSync(coverageDir)) {
            fs.mkdirSync(coverageDir, { recursive: true });
          }

          const coveragePath = path.resolve(
            coverageDir,
            buildFileName(test, options.uniqueFileName),
          );

          output.print(`writing ${coveragePath}`);
          fs.writeFileSync(coveragePath, JSON.stringify(coverageInfo));
        } catch (err) {
          console.error(err);
        }
      },
      true,
    );
  });
};
