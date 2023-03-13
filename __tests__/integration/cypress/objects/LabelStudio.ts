import { expect } from 'chai';

export const LabelStudio = {
  init(params: Record<string, any>) {
    Cypress.on('window:before:load', (win) => {
      win.LSF_CONFIG = {
        interfaces: [
          'panel',
          'update',
          'submit',
          'skip',
          'controls',
          'infobar',
          'topbar',
          'instruction',
          'side-column',
          'ground-truth',
          'annotations:tabs',
          'annotations:menu',
          'annotations:current',
          'annotations:add-new',
          'annotations:delete',
          'annotations:view-all',
          'predictions:tabs',
          'predictions:menu',
          'auto-annotation',
          'edit-history',
        ],
        ...params,
      };
    });

    cy.visit('/');

    cy
      .window()
      .then(win => expect(win.LabelStudio.instances.size).to.be.equal(1));
  },
  serialize(){
    return cy
      .window()
      .then(win => {
        return win.Htx.annotationStore.selected.serializeAnnotation();
      });
  },
  setFeatureFlags(flags: Record<string, boolean>) {
    Cypress.on('window:before:load', (win) => {
      win.__FEATURE_FLAGS__ = { ...flags };
    });
  },
  shouldHaveFeatureFlag(flagName: string) {
    return this
      .getFeatureFlag(flagName)
      .then(flagValue => {
        expect(flagValue).to.be.true;
      });
  },
  getFeatureFlag(flagName: string){
    return cy
      .window()
      .then(win => {
        const featureFlags = (win.APP_SETTINGS?.feature_flags ?? {}) as Record<string, boolean>;     

        console.log(featureFlags);

        const flagValue = (flagName in featureFlags)
          ? featureFlags[flagName]
          : window.APP_SETTINGS?.feature_flags_default_value === true;

        return flagValue;
      });
  },
};
