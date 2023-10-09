import { types } from 'mobx-state-tree';
import { isDefined } from '../utils/utilities';

const SelectedChoiceMixin = types
  .model()
  .views(self => ({
    findSelectedChoice(aliasOrValue) {
      let item;

      if (self.findLabel) {
        item = self.findLabel(aliasOrValue);
      } else if (self.findItemByValueOrAlias) {
        item = self.findItemByValueOrAlias(aliasOrValue);
      }

      return item?.alias || item?.value;
    },
    selectedChoicesMatch(aliasOrValue1, aliasOrValue2) {
      const choice1 = self.findSelectedChoice(aliasOrValue1);
      const choice2 = self.findSelectedChoice(aliasOrValue2);

      return isDefined(choice1) && isDefined(choice2) && choice1 === choice2;
    },
    hasChoiceSelection(choiceValue) {
      if (choiceValue?.length) {
        // grab the string value; for taxonomy, it's the last value in the array
        const selectedValues = self.selectedValues().map(s => Array.isArray(s) ? s.at(-1) : s);

        return choiceValue.some(value => selectedValues.includes(value));
      }

      return self.isSelected;
    },
  }));

export default SelectedChoiceMixin;
