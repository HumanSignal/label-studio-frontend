if (process.env.NODE_ENV !== 'production' && !window.APP_SETTINGS) {
  const APP_SETTINGS = window.APP_SETTINGS as Record<string, any> | undefined;

  const flags = (() => {
    try {
      return require('./flags.json');
    } catch (err) {
      return {};
    }
  })();

  Object.assign(window, {
    APP_SETTINGS: {
      feature_flags: {
        ...(APP_SETTINGS?.feature_flags ?? {}),
        ...flags,
      },
    },
  });
}
