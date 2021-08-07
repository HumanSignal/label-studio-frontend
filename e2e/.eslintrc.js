module.exports = {
  plugins: [
    "codeceptjs",
  ],
  rules: {
    "codeceptjs/no-exclusive-tests": "error",
    "codeceptjs/no-skipped-tests": "warn",
    "codeceptjs/no-pause-in-scenario": "error",
  },
};
