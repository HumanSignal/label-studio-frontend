if (process.env.NODE_ENV !== 'production') {
  const flags = (() => {
    try {
      return require("./flags.json");
    } catch (err) {
      return {};
    }
  })();

  Object.assign(window, {
    APP_SETTINGS: {
      feature_flags: flags,
    },
  });
}
