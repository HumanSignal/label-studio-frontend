import { getParent, types } from 'mobx-state-tree';
import { FF_DEV_1372, isFF } from '../utils/feature-flags';
import { isDefined } from '../utils/utilities';

/*
 * Per Region Mixin
 */
const VisibilityMixin = types
  .model({
    visiblewhen: types.maybeNull(types.string),
    whentagname: types.maybeNull(types.string),
    whenchoicevalue: types.maybeNull(types.string),
    whenlabelvalue: types.maybeNull(types.string),
  })
  .views(self => ({
    get isVisible() {
      if (getParent(self, 2)?.isVisible === false) {
        return false;
      }

      if (self.visiblewhen) {
        const fns = {
          'region-selected': ({ tagName, labelValue }) => {
            const area = self.annotation.highlightedNode;

            if (!area || (tagName && area.labeling?.from_name.name !== tagName)) {
              return false;
            }

            if (labelValue) return labelValue.split(',').some(v => area.hasLabel(v));

            return true;
          },

          'choice-selected': ({ tagName, choiceValue }) => {
            if (!tagName) {
              for (const choices of self.annotation.names.values()) {
                if (choices.type === 'choices' && choices.selectedValues && choices.selectedValues().length) {
                  return true;
                }
              }
              return false;
            }

            const tag = self.annotation.names.get(tagName);

            if (!tag) return false;

            if (choiceValue) {
              // @todo Revisit this and make it more consistent, and refactor this
              // behaviour out of the SelectedModel mixin and use a singular approach.
              // This is the original behaviour of other SelectedModel mixin usages
              // as they are using alias lookups for choices. For now we will keep it as is since it works for all the
              // other cases currently.
              if (tag.findLabel) {
                return choiceValue
                  .split(',')
                  .map(v => tag.findLabel(v))
                  .some(c => c && c.sel);
              }

              // Check the selected values of the choices for existence of the choiceValue(s)
              // This currently doesn't work for alias lookups as it is a direct comparison.
              const selectedValues = (tag.selectedValues() || []).flat();

              if (selectedValues.length) {
                return choiceValue.split(',').some(v => selectedValues.includes(v));
              }

              return false;
            }

            return tag.isSelected;
          },

          'no-region-selected': () => !self.annotation.highlightedNode,
        };

        if (isFF(FF_DEV_1372)) {
          fns['choice-unselected'] = params => !fns['choice-selected'](params);
        }
        if (Object.keys(fns).includes(self.visiblewhen)) {
          const res = fns[self.visiblewhen]({
            tagName: self.whentagname,
            choiceValue: self.whenchoicevalue,
            labelValue: self.whenlabelvalue,
          });

          return res !== false;
        }
      } else if (self.whenchoicevalue) {
        for (const choices of self.annotation.names.values()) {
          const choicesList = choices?.selectedValues?.();

          if (choicesList?.length) {
            for (const obj of choicesList){
              if (obj === self.whenchoicevalue)
                return true;
            }
          }
        }

        return false;
      }

      return true;
    },
  }));

export default VisibilityMixin;
