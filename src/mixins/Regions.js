import { types, getParent, getRoot } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";

const RegionsMixin = types
  .model({
    // id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    score: types.maybeNull(types.number),
    readonly: types.optional(types.boolean, false),

    hidden: types.optional(types.boolean, false),

    parentID: types.optional(types.string, ""),
  })
  .volatile(self => ({
    // selected: false,
    highlighted: false,
  }))
  .views(self => ({
    get perRegionStates() {
      const states = self.states;
      return states && states.filter(s => s.perregion === true);
    },

    get store() {
      return getRoot(self);
    },

    get parent() {
      return getParent(self);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get editable() {
      return self.readonly === false && self.completion.editable === true;
    },
  }))
  .actions(self => ({
    setParentID(id) {
      self.parentID = id;
    },

    moveTop(size) {},
    moveBottom(size) {},
    moveLeft(size) {},
    moveRight(size) {},

    sizeRight(size) {},
    sizeLeft(size) {},
    sizeTop(size) {},
    sizeBottom(size) {},

    // "web" degree is opposite to mathematical, -90 is 90 actually
    // swapSizes = true when canvas is already rotated at this moment
    rotatePoint(point, degree, swapSizes = true) {
      const { x, y } = point;
      if (!degree) return { x, y };

      degree = (360 + degree) % 360;
      // transform origin is (w/2, w/2) for ccw rotation
      // (h/2, h/2) for cw rotation
      const w = self.parent.stageWidth;
      const h = self.parent.stageHeight;
      // actions: translate to fit origin, rotate, translate back
      //   const shift = size / 2;
      //   const newX = (x - shift) * cos + (y - shift) * sin + shift;
      //   const newY = -(x - shift) * sin + (y - shift) * cos + shift;
      // for ortogonal degrees it's simple:
      if (degree === 270) return { x: y, y: (swapSizes ? h : w) - x };
      if (degree === 90) return { x: (swapSizes ? w : h) - y, y: x };
      if (Math.abs(degree) === 180) return { x: w - x, y: h - y };
      return { x, y };
    },

    rotateDimensions({ width, height }, degree) {
      if ((degree + 360) % 180 === 0) return { width, height };
      return { width: height, height: width };
    },

    // update region appearence based on it's current states, for
    // example bbox needs to update its colors when you change the
    // label, becuase it takes color from the label
    updateAppearenceFromState() {},

    serialize() {
      console.error("Region class needs to implement serialize");
    },

    toStateJSON() {
      const parent = self.parent;
      const buildTree = control => {
        const tree = {
          id: self.pid,
          from_name: control.name,
          to_name: parent.name,
          source: parent.value,
          type: control.type,
          parent_id: self.parentID === "" ? null : self.parentID,
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states
          .map(s => {
            const ser = self.serialize(s, parent);
            if (!ser) return null;

            const tree = {
              ...buildTree(s),
              ...ser,
            };

            // in case of labels it's gonna be, labels: ["label1", "label2"]

            return tree;
          })
          .filter(Boolean);
      } else {
        const obj = self.completion.toNames.get(parent.name);
        const control = obj.length ? obj[0] : obj;

        const tree = {
          ...buildTree(control),
          ...self.serialize(control, parent),
        };

        return tree;
      }
    },

    selectRegion() {},

    /**
     * @todo fix "keep selected" setting
     * Common logic for unselection; specific actions should be in `afterUnselectRegion`
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
    unselectRegion(tryToKeepStates = false) {
      console.log("UNSELECT REGION", "you should not be here");
      if (1) return;
      const completion = self.completion;
      const parent = self.parent;
      const keepStates = tryToKeepStates && self.store.settings.continuousLabeling;

      if (completion.relationMode) {
        completion.stopRelationMode();
      }
      if (parent.setSelected) {
        parent.setSelected(undefined);
      }

      self.selected = false;
      completion.setHighlightedNode(null);

      self.afterUnselectRegion();

      if (!keepStates) {
        completion.unloadRegionState(self);
      }
    },

    afterUnselectRegion() {},

    onClickRegion() {
      const completion = self.completion;
      if (!completion.editable) return;

      if (completion.relationMode) {
        completion.addRelation(self);
        completion.stopRelationMode();
        completion.regionStore.unselectAll();
      } else {
        const wasNotSelected = !self.selected;
        completion.unselectAll();
        if (wasNotSelected) {
          completion.selectArea(self);
        }
      }
    },

    setHighlight(val) {
      self.highlighted = val;
    },

    toggleHighlight() {
      self.setHighlight(!self.highlighted);
    },

    toggleHidden(e) {
      self.hidden = !self.hidden;
      e && e.stopPropagation();
    },
  }));

export default RegionsMixin;
