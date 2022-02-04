import { getEnv, getRoot, types } from "mobx-state-tree";
import { cloneNode, restoreNewsnapshot } from "../core/Helpers";
import { AnnotationMixin } from "./AnnotationMixin";

const ToolMixin = types
  .model({
    selected: types.optional(types.boolean, false),
    group: types.optional(types.string, 'default'),
    shortcut: types.optional(types.maybeNull(types.string), null),
  })
  .views(self => ({
    get obj() {
      return self.manager?.obj ?? getEnv(self).object;
    },

    get manager() {
      return getEnv(self).manager;
    },

    get control() {
      return getEnv(self).control;
    },

    get viewClass() {
      return () => null;
    },

    get fullName() {
      return self.toolName + (self.dynamic ? '-dynamic' : '');
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

    get getActiveShape() {
      // active shape here is the last one that was added
      const obj = self.obj;

      return obj.regs[obj.regs.length - 1];
    },

    get getSelectedShape() {
      return self.control.annotation.highlightedNode;
    },

    get extraShortcuts() {
      return {};
    },

    get shouldPreserveSelectedState() {
      try {
        const settings = getRoot(self.obj).settings;

        return settings.preserveSelectedTool;
      } catch (err) {
        console.log('something is missing');
        return false;
      }
    },

    get isPreserved() {
      return window.localStorage.getItem(`selected-tool:${self.obj?.name}`) === self.fullName;
    },
  }))
  .actions(self => ({
    setSelected(selected) {
      self.selected = selected;
      self.afterUpdateSelected();

      if (selected && self.obj) {
        const storeName = `selected-tool:${self.obj.name}`;

        if (self.shouldPreserveSelectedState) {
          window.localStorage.setItem(storeName, self.fullName);
        }
      }
    },

    afterUpdateSelected() {},

    event(name, ev, args) {
      const fn = name + "Ev";

      if (typeof self[fn] !== "undefined") self[fn].call(self, ev, args);
    },

    createFromJSON(obj, fromModel) {
      let r;
      let states = [];

      const fm = self.annotation.names.get(obj.from_name);

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
        const params = {};
        const moreParams = self.moreRegionParams?.(obj) ?? obj;
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

export default types.compose(ToolMixin, AnnotationMixin);
