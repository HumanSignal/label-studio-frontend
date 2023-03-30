import { LabelStudio } from 'cypress/objects/LabelStudio';

describe('Feature Flags', () => {
  it('can set feature flags on the global object', () => {
    const flagName = 'customFeatureFlag';

    LabelStudio.setFeatureFlags({
      [flagName]: true,
    });

    cy.visit('/');

    LabelStudio.shouldHaveFeatureFlag(flagName);
  });
});

