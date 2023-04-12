import { LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';

describe('Feature Flags', () => {
  it('can set feature flags on the global object', () => {
    const flagName = 'customFeatureFlag';

    cy.visit('/');

    LabelStudio.setFeatureFlags({
      [flagName]: true,
    });

    LabelStudio.shouldHaveFeatureFlag(flagName);
  });

  it('can set feature flags before navigation', () => {
    const flagName = 'customFeatureFlag';

    LabelStudio.setFeatureFlagsOnPageLoad({
      [flagName]: true,
    });

    cy.visit('/');

    LabelStudio.shouldHaveFeatureFlag(flagName);
  });
});

