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
    hasChoiceSelection(choiceValue, _selectedValues = []) {
      if (choiceValue?.length) {
        // @todo Revisit this and make it more consistent, and refactor this
        // behaviour out of the SelectedModel mixin and use a singular approach.
        // This is the original behaviour of other SelectedModel mixin usages
        // as they are using alias lookups for choices. For now we will keep it as is since it works for all the
        // other cases currently.
        if (self.findLabel) {
          return choiceValue
            .map(v => self.findLabel(v))
            .some(c => c && c.sel);
        }

        // Check the selected values of the choices for existence of the choiceValue(s)
        const selectedValues = _selectedValues.flat();

        if (selectedValues.length) {
          const includesValue = v => {
            if (self.findItemByValueOrAlias) {
              const item = self.findItemByValueOrAlias(v);

              v = item?.alias || item?.value || v;
            }

            return selectedValues.includes(v);
          };

          return choiceValue.some(includesValue);
        }

        return false;
      }

      return self.isSelected;
    },
  }));

export default SelectedChoiceMixin;
