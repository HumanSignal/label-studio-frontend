import { LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';

describe('Feature Flags', () => {
  it('can set feature flags on the global object', () => {
    const flagName = 'customFeatureFlag';
    const anotherFlag = 'anotherFlag';

    cy.visit('/');

    LabelStudio.setFeatureFlags({
      [flagName]: true,
    });

    LabelStudio.featureFlag(flagName).should('be.true');
    LabelStudio.featureFlag(anotherFlag).should('be.false');
  });

  it('can set feature flags before navigation', () => {
    // setting only this flag
    const flagName = 'customFeatureFlag';
    const anotherFlag = 'anotherFlag';

    LabelStudio.setFeatureFlagsOnPageLoad({
      [flagName]: true,
    });

    cy.visit('/');

    LabelStudio.featureFlag(flagName).should('be.true');
    LabelStudio.featureFlag(anotherFlag).should('be.false');
  });
});

