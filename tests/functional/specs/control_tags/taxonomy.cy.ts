import { LabelStudio, Taxonomy, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import { simpleData, taxonomyConfig } from '../../data/control_tags/taxonomy';

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
  });
});