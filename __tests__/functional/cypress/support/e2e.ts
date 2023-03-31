import { CURRENT_FLAGS } from '../../feature-flags';

before(() => {
  cy.on('window:before:load', (win) => {
    Object.assign(win, {
      APP_SETTINGS: {
        ...(win.APP_SETTINGS ?? {}),
        feature_flags: CURRENT_FLAGS,
      },
    });
  });
});
