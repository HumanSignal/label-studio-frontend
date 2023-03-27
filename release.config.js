module.exports = {
  branches: ['master'],
  plugins: [
    // Parse the commit messages to determine if a new release is needed.
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    // Release the package to NPM.
    '@semantic-release/npm',
    [
      // Create a release in GitHub.
      '@semantic-release/github',
      {
        // Ensures a new Github issue is not created for each failed build.
        failComment: false,
      },
    ],
  ],
};
