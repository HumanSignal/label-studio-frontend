import { types, getRoot } from "mobx-state-tree";
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

    get completion() {
      return getRoot(self.control).completionStore.selected;
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
        const stateProvidesColor = states.find(s => s && s.hasOwnProperty("getSelectedColor"));
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
      let r;
      let states = [];

      const fm = self.completion.names.get(obj.from_name);
      fm.fromStateJSON(obj);

      // workaround to prevent perregion textarea from duplicating
      // during deserialisation
      if (fm.perregion && fromModel.type === "textarea") return;

      const { stateTypes, controlTagTypes } = self.tagTypes;

      if (!fm.perregion && !controlTagTypes.includes(fromModel.type)) return;

      if (obj.type === stateTypes) {
        states = restoreNewsnapshot(fromModel);
        if (states.fromStateJSON) {
          states.fromStateJSON(obj);
        }

        states = [states];
      }

      if (controlTagTypes.includes(obj.type)) {
        const params = self.paramsFromStates(states);
        const moreParams = self.moreRegionParams(obj);
        const data = {
          pid: obj.id,
          parentID: obj.parent_id === null ? "" : obj.parent_id,
          score: obj.score,
          readonly: obj.readonly,
          coordstype: "perc",
          states,
          ...params,
          ...obj.value,
          ...moreParams,
        };

        r = self.createRegion(data);
      } else if (fm.perregion) {
        const m = restoreNewsnapshot(fromModel);

        // [TODO] this is a poor mans findRegion for the image
        // regions right now. This is based on a idea that
        // results comming from the same region share the same
        // id, which might not be the case since it'd a good
        // practice to have unique ids
        const { regions } = self.obj;
        r = regions.find(r => r.pid === obj.id);

        // r = self.findRegion(obj.value);

        if (r) r.states.push(m);
      }

      return r;
    },

    fromStateJSON(obj, fromModel) {
      // tool may not be implementing fromStateJSON at all
      if (!self.tagTypes) return;

      return self.createFromJSON(obj, fromModel);
    },
  }));

export default ToolMixin;
