import { types, getParent, destroy } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";
import Result from "../regions/Result";

export const AreaMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    results: types.array(Result),
  })
  .views(self => ({
    // self id without completion id added to uniquiness across all the tree
    get cleanId() {
      return self.id.replace(/#.*/, "");
    },

    get completion() {
      return getParent(self, 2);
    },

    get labeling() {
      return self.results.find(r => r.type.endsWith("labels"));
    },

    get tag() {
      return self.labeling?.from_name;
    },

    hasLabel(value) {
      return self.labeling?.mainValue?.includes(value);
    },

    get perRegionTags() {
      return self.completion.toNames.get(self.object.name)?.filter(tag => tag.perregion) || [];
    },

    get parent() {
      return self.object;
    },

    get style() {
      const styled = self.results.find(r => r.style);
      return styled && styled.style;
    },

    // @todo may be slow, consider to add some code to completion (un)select* methods
    get selected() {
      return self.completion.highlightedNode === self;
    },

    getOneColor() {
      return self.style && self.style.fillcolor;
    },
  }))
  .volatile(self => ({
    // selected: false,
  }))
  .actions(self => ({
    beforeDestroy() {
      self.results.forEach(r => destroy(r));
    },

    setSelected(value) {
      self.selected = value;
    },

    addResult(r) {
      self.results.push(r);
    },

    removeResult(r) {
      const index = self.results.indexOf(r);
      if (index < 0) return;
      self.results.splice(index, 1);
      destroy(r);
      if (!self.results.length) self.completion.deleteArea(self);
    },

    setValue(tag) {
      const result = self.results.find(r => r.from_name === tag);
      const values = tag.selectedValues();
      if (result) {
        if (tag.holdsState) result.setValue(values);
        else self.removeResult(result);
      } else {
        self.results.push({
          area: self,
          from_name: tag,
          to_name: self.object,
          type: tag.resultType,
          value: {
            [tag.valueType]: values,
          },
        });
      }
      self.updateAppearenceFromState && self.updateAppearenceFromState();
    },
  }));
