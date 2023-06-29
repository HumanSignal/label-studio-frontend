import { LabelStudio, Taxonomy, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import {
  dataWithPrediction,
  dynamicData,
  dynamicTaxonomyConfig,
  simpleData,
  taxonomyConfig,
  taxonomyConfigWithMaxUsages
} from '../../data/control_tags/taxonomy';
import { FF_DEV_2100_A, FF_DEV_3617 } from '../../../../src/utils/feature-flags';

beforeEach(() => {
  LabelStudio.addFeatureFlagsOnPageLoad({
    [FF_DEV_2100_A]: true, // preselected choices
  });
});

const init = (config, data) => {
  LabelStudio.params()
    .config(config)
    .data(data)
    .withResult([])
    .init();
};

describe('Control Tags - Taxonomy', () => {
  it('should show hint for <Choice />', () => {
    init(taxonomyConfig, simpleData);

    Taxonomy.open();
    Taxonomy.findItem('Choice 2').trigger('mouseenter');
    Tooltip.hasText('A hint for Choice 2');
    Taxonomy.findItem('Choice 3').find('[type=checkbox]').should('not.be.checked');
  });

  it('should show error message if there are more choices selected than maxUsages is set', () => {
    LabelStudio.init({
      config: taxonomyConfigWithMaxUsages,
      task: dataWithPrediction,
    });

    cy.contains('button', 'Update').click();

    cy.contains('The number of options selected (2) exceed the maximum allowed (1). To proceed, first unselect excess options for: • Taxonomy (taxonomy)').should('exist');
  });

  it('should not show error message if choices selected is equal than maxUsages', () => {
    LabelStudio.params()
      .config(taxonomyConfigWithMaxUsages)
      .data(simpleData)
      .withResult([
        {
          'id': 'n2ldmNpSQI',
          'type': 'taxonomy',
          'value': {
            'taxonomy': [
              [
                'Bacteria',
              ],
            ],
          },
          'origin': 'manual',
          'to_name': 'text',
          'from_name': 'taxonomy',
        },
      ])
      .init();

    cy.contains('button', 'Update').click();

    cy.contains('The number of options selected (2) exceed the maximum allowed (1). To proceed, first unselect excess options for: • Taxonomy (taxonomy)').should('not.exist');
  });
});

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
