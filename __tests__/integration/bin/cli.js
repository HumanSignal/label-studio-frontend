#!/usr/bin/env node

import cypress from 'cypress';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import childProcess from 'child_process';
import { stdout } from 'process';

yargs(hideBin(process.argv))
  .command('run', 'run', () => {}, (args) => {
    const { help, _, ...rest } = args;

    if (help) {
      stdout.write(childProcess.execSync('yarn run cypress run --help'));
      process.exit(0);
    }

    cypress.run(rest);
  })
  .command('open', 'Open UI', () => {}, (args) => {
    const { help, _, ...rest } = args;

    if (help) {
      stdout.write(childProcess.execSync('yarn run cypress open --help'));
      process.exit(0);
    }

    cypress.open(rest);
  })
  .help(false)
  .parse();

