import { getParent, types } from 'mobx-state-tree';

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

            if (!tag?.hasChoiceSelection && !choiceValue?.length) return false;

            return tag.hasChoiceSelection(choiceValue?.split(','), tag.selectedValues());
          },

          'no-region-selected': () => !self.annotation.highlightedNode,
          'choice-unselected': params => !fns['choice-selected'](params),
        };

        if (Object.keys(fns).includes(self.visiblewhen)) {
          const res = fns[self.visiblewhen]({
            tagName: self.whentagname,
            choiceValue: self.whenchoicevalue,
            labelValue: self.whenlabelvalue,
          });

          return res !== false;
        }
      }

      return true;
    },
  }));

export default VisibilityMixin;
