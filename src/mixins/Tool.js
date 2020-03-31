import { types } from "mobx-state-tree";

import { cloneNode, restoreNewsnapshot } from "../core/Helpers";

const ToolMixin = types
  .model({
    selected: types.optional(types.boolean, false),
  })
  .views(self => ({
    get obj() {
      return self._manager.obj;
    },

    get manager() {
      return self._manager;
    },

    get control() {
      return self._control;
    },

    get viewClass() {
      return null;
    },

    get clonedStates() {
      const states = [self.control];
      const activeStates = states
        ? states.filter(c => c.isSelected)
        : // .filter(
          //   c =>
          //     c.type === IMAGE_CONSTANTS.rectanglelabels ||
          //     c.type === IMAGE_CONSTANTS.keypointlabels ||
          //     c.type === IMAGE_CONSTANTS.polygonlabels ||
          //     c.type === IMAGE_CONSTANTS.brushlabels,
          // )
          null;

      return activeStates ? activeStates.map(s => cloneNode(s)) : null;
    },

    //
    moreRegionParams(obj) {},

    // given states try to find a state that can provide a color
    // params for the region
    paramsFromStates(states) {
      const c = self.control;
      let fillcolor = c.fillcolor;
      let strokecolor = c.strokecolor;

      if (states && states.length) {
        const stateProvidesColor = states.find(s => s.hasOwnProperty("getSelectedColor"));
        if (stateProvidesColor) {
          const color = stateProvidesColor.getSelectedColor();
          fillcolor = color;
          strokecolor = color;
        }
      }

      return {
        fillColor: fillcolor,
        strokeColor: strokecolor,
      };
    },

    // clones the current state, dervies params from it (like colors)
    // and returns that as an object. This method is used to
    // reconstruct the region and it's labels.
    get statesAndParams() {
      const states = self.clonedStates;
      const params = self.paramsFromStates(states);

      return { states: states, ...params };
    },

    get getActiveShape() {
      // active shape here is the last one that was added
      const obj = self.obj;
      return obj.regions[obj.regions.length - 1];
    },

    get getSelectedShape() {
      return self.control.completion.highlightedNode;
    },
  }))
  .actions(self => ({
    setSelected(val) {
      self.selected = val;
    },

    event(name, ev, args) {
      const fn = name + "Ev";
      if (typeof self[fn] !== "undefined") self[fn].call(self, ev, args);
    },

    createFromJSON(obj, fromModel) {
      const { stateTypes, controlTagTypes } = self.tagTypes;
      let states = null;

      if (obj.type === stateTypes) {
        states = restoreNewsnapshot(fromModel);
        if (states.fromStateJSON) {
          states.fromStateJSON(obj);
        }

        states = [states];
      }

      const params = self.paramsFromStates(states);
      const moreParams = self.moreRegionParams(obj);

      if (controlTagTypes.includes(obj.type)) {
        return self.createRegion({
          pid: obj.id,
          score: obj.score,
          readonly: obj.readonly,
          coordstype: "perc",
          states: states,
          ...params,
          ...obj.value,
          ...moreParams,
        });
      }
    },

    fromStateJSON(obj, fromModel) {
      // tool may not be implementing fromStateJSON at all
      if (!self.tagTypes) return;

      return self.createFromJSON(obj, fromModel);
    },
  }));

export default ToolMixin;
