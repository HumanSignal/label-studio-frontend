import { defineConfig } from 'cypress';

const LSF_PORT = process.env.LSF_PORT ?? '3000';

export default defineConfig({
  // Assets configuration 
  videosFolder: './output/video',
  screenshotsFolder: './output/screenshots',
  downloadsFolder: './output/downloads',
  fixturesFolder: './fixtures',
  trashAssetsBeforeRuns: true,
  videoUploadOnPasses: false,
  e2e: {
    baseUrl: `http://localhost:${ LSF_PORT }`,
    specPattern: './specs/**/*.cy.ts',
    viewportWidth: 1600,
    viewportHeight: 900,
    // output config
    setupNodeEvents(on, config) {
    },
  },
});
