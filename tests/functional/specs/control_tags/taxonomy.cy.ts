import { LabelStudio, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import { useTaxonomy } from '@heartexlabs/ls-test/helpers/LSF';
import {
  dataWithPrediction,
  simpleData,
  taxonomyConfig,
  taxonomyConfigWithMaxUsages,
  taxonomyResultWithAlias
} from '../../data/control_tags/taxonomy';
import { FF_PROD_309, FF_TAXONOMY_ASYNC, FF_TAXONOMY_LABELING } from '../../../../src/utils/feature-flags';

const taxonomies = {
  'Old Taxonomy': useTaxonomy('&:eq(0)'),
  'New Taxonomy': useTaxonomy('&:eq(0)', true),
};

Object.entries(taxonomies).forEach(([title, Taxonomy]) => {
  describe('Control Tags - ' + title, () => {
    beforeEach(() => {
      if (Taxonomy.isNew) {
        LabelStudio.addFeatureFlagsOnPageLoad({
          [FF_TAXONOMY_ASYNC]: true,
          [FF_TAXONOMY_LABELING]: true,
        });
      }
    });

    it('should show hint for <Choice />', () => {
      LabelStudio.params()
        .config(taxonomyConfig)
        .data(simpleData)
        .withResult([])
        .init();

      Taxonomy.open();
      Taxonomy.findItem('Choice 2').trigger('mouseenter');
      Tooltip.hasText('A hint for Choice 2');
    });

    it('should use aliases everywhere if given', () => {
      LabelStudio.params()
        .config(taxonomyConfig)
        .data(simpleData)
        .withResult([taxonomyResultWithAlias])
        .init();

      Taxonomy.hasSelected('Choice 2');
      Taxonomy.open();
      Taxonomy.findItem('Choice 2').click();
      Taxonomy.findItem('Choice 1').click();
      Taxonomy.hasSelected('Choice 1');

      LabelStudio.serialize().then(result => {
        expect(result.length).to.be.eq(1);
        expect(result[0].value.taxonomy).to.be.eql([['C1']]);
      });
    });

    // @todo check real Taxonomy actions, not just a submit action
    it('should show error message if there are more choices selected than maxUsages is set', () => {
      LabelStudio.init({
        config: taxonomyConfigWithMaxUsages,
        task: dataWithPrediction,
      });

      cy.contains('button', 'Update').click();

      cy.contains('The number of options selected (2) exceed the maximum allowed (1). To proceed, first unselect excess options for: • Taxonomy (taxonomy)').should('exist');
    });

    it('should not show error message if choices selected is equal to maxUsages', () => {
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
});
