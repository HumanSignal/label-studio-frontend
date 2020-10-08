import { types } from "mobx-state-tree";

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
      if (self.visiblewhen) {
        const fns = {
          "region-selected": ({ tagName, labelValue }) => {
            const area = self.completion.highlightedNode;

            if (!area || (tagName && area.labeling?.from_name.name !== tagName)) {
              return false;
            }

            if (labelValue) return labelValue.split(",").some(v => area.hasLabel(v));

            return true;
          },

          "choice-selected": ({ tagName, choiceValue }) => {
            if (!tagName) {
              for (let choices of self.completion.names.values()) {
                if (choices.type === "choices" && choices.selectedValues && choices.selectedValues().length) {
                  return true;
                }
              }
              return false;
            }

            const tag = self.completion.names.get(tagName);

            if (!tag) return false;

            if (choiceValue) {
              const choicesSelected = choiceValue
                .split(",")
                .map(v => tag.findLabel(v))
                .some(c => c && c.selected);
              return choicesSelected;
            }

            return tag.isSelected;
          },

          "no-region-selected": ({ tagName }) => !self.completion.highlightedNode,
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
  }))
  .actions(self => ({}));

export default VisibilityMixin;
