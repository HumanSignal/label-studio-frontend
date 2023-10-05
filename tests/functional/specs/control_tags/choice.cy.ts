import { Choices, LabelStudio, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import {
  choicesConfig,
  choicesMultipleSelectionConfig, choicesSelectLayoutConfig,
  simpleData
} from '../../data/control_tags/choice';

describe('Control Tags - Choice', () => {
  it('should show hint for <Choice />', () => {
    LabelStudio.params()
      .config(choicesConfig)
      .data(simpleData)
      .withResult([])
      .init();

    Choices.findChoice('Choice 2').trigger('mouseenter');
    Tooltip.hasText('A hint for Choice 2');
  });

  it('should show hint for <Choise />', () => {
    LabelStudio.params()
      .config(choicesMultipleSelectionConfig)
      .data(simpleData)
      .withResult([])
      .init();

    Choices.findChoice('Choice 2').trigger('mouseenter');
    Tooltip.hasText('A hint for Choice 2');
  });

  it('should show hint for <Choice /> when layout="select"', () => {
    LabelStudio.params()
      .config(choicesSelectLayoutConfig)
      .data(simpleData)
      .withResult([])
      .init();

    Choices.toggleSelect();
    Choices.findOption('Choice 2').trigger('mouseenter');
    Tooltip.hasText('A hint for Choice 2');
  });
});