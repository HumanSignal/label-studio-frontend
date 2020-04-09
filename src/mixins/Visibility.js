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
            const reg = self.completion.highlightedNode;

            if (reg === null || reg === undefined || (tagName && reg.parent.name != tagName)) {
              return false;
            }

            if (labelValue) return reg.hasLabelState(labelValue);

            return true;
          },

          "choice-selected": ({ tagName, choiceValue }) => {
            const tag = self.completion.names.get(tagName);

            if (!tag) return false;

            if (choiceValue) {
              const choice = tag.findLabel(choiceValue);
              return choice && choice.selected ? true : false;
            }

            return true;
          },

          "no-region-selected": ({ tagName }) => self.completion.highlightedNode === null,
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
