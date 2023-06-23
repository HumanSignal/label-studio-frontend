import { LabelStudio, Taxonomy, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import { simpleData, taxonomyConfig } from '../../data/control_tags/taxonomy';
import { FF_DEV_2100_A, FF_DEV_3617 } from '../../../../src/utils/feature-flags';

beforeEach(() => {
  LabelStudio.addFeatureFlagsOnPageLoad({
    [FF_DEV_2100_A]: true, // preselected choices
  });
});

describe('Control Tags - Taxonomy', () => {
  it('should show hint for <Choice />', () => {
    LabelStudio.params()
      .config(taxonomyConfig)
      .data(simpleData)
      .withResult([])
      .init();

    Taxonomy.open();
    Taxonomy.findItem('Choice 2').trigger('mouseenter');
    Tooltip.hasText('A hint for Choice 2');
    Taxonomy.findItem('Choice 3').find('[type=checkbox]').should('not.be.checked');
  });
});

const init = () => {
  LabelStudio.params()
    .config(taxonomyConfig)
    .data(simpleData)
    .withResult([])
    .init();
};

describe('Control Tags - Taxonomy with preselected Choices', () => {
  // @todo fix this test
  it('should work with FF_DEV_3617 on', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_3617]: true,
    });

    init();
    cy.get('.lsf-annotations-list').click();
    cy.get('.lsf-annotations-list__create').click();
    Taxonomy.open();
    Taxonomy.findItem('Choice 3').find('[type=checkbox]').should('be.checked');
  });

  it('should work with FF_DEV_3617 off', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_3617]: false,
    });

    init();
    cy.get('.lsf-annotations-list').click();
    cy.get('.lsf-annotations-list__create').click();
    Taxonomy.open();
    Taxonomy.findItem('Choice 3').find('[type=checkbox]').should('be.checked');
  });
});