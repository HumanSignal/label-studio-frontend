import { LabelStudio, Taxonomy, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import { dynamicData, dynamicTaxonomyConfig, simpleData, taxonomyConfig } from '../../data/control_tags/taxonomy';
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

const init = (config, data) => {
  LabelStudio.params()
    .config(config)
    .data(data)
    .withResult([])
    .init();
};

describe('Control Tags - Taxonomy with preselected Choices', () => {
  const FF_DEV_3617_STATES = [true, false];
  const datasets = [
    { title: 'static', config: taxonomyConfig, data: simpleData },
    { title: 'dynamic', config: dynamicTaxonomyConfig, data: dynamicData },
  ];

  for (const ffState of FF_DEV_3617_STATES) {
    for (const { config, data, title } of datasets) {
      it(`should work with FF_DEV_3617 ${ffState ? 'on' : 'off'} for ${title} dataset`, () => {
        LabelStudio.addFeatureFlagsOnPageLoad({
          [FF_DEV_3617]: ffState,
        });

        init(config, data);
        cy.get('.lsf-annotations-list').click();
        cy.get('.lsf-annotations-list__create').click();
        Taxonomy.open();
        Taxonomy.findItem('Choice 3').find('[type=checkbox]').should('be.checked');
      });
    }
  }
});
