import { types, getParent, getEnv, getRoot, destroy, detach, resolveIdentifier } from "mobx-state-tree";

import Constants from "../core/Constants";
import Hotkey from "../core/Hotkey";
import NormalizationStore from "./NormalizationStore";
import RegionStore from "./RegionStore";
import Registry from "../core/Registry";
import RelationStore from "./RelationStore";
import TimeTraveller from "../core/TimeTraveller";
import Tree, { TRAVERSE_STOP } from "../core/Tree";
import Types from "../core/Types";
import Utils from "../utils";
import { AllRegionsType } from "../regions";
import { guidGenerator } from "../core/Helpers";
import Region from "../regions/Region";
import Area from "../regions/Area";

console.log("ALL TYPES", Types.allModelsTypes());

const Completion = types
  .model("Completion", {
    id: types.identifier,
    // @todo this value used `guidGenerator(5)` as default value before
    // @todo but it calculates once, so all the completions have the same pk
    // @todo why don't use only `id`?
    // @todo reverted back to wrong type; maybe it breaks all the deserialisation
    pk: types.optional(types.string, guidGenerator(5)),

    selected: types.optional(types.boolean, false),
    type: types.enumeration(["completion", "prediction"]),

    createdDate: types.optional(types.string, Utils.UDate.currentISODate()),
    createdAgo: types.maybeNull(types.string),
    createdBy: types.optional(types.string, "Admin"),

    loadedDate: types.optional(types.Date, new Date()),
    leadTime: types.maybeNull(types.number),

    //
    userGenerate: types.optional(types.boolean, true),
    update: types.optional(types.boolean, false),
    sentUserGenerate: types.optional(types.boolean, false),
    localUpdate: types.optional(types.boolean, false),

    honeypot: types.optional(types.boolean, false),
    skipped: false,

    // root: Types.allModelsTypes(),
    names: types.map(types.reference(Types.allModelsTypes())),
    toNames: types.map(types.array(types.reference(Types.allModelsTypes()))),

    history: types.optional(TimeTraveller, { targetPath: "../regions" }),

    dragMode: types.optional(types.boolean, false),

    editable: types.optional(types.boolean, true),

    relationMode: types.optional(types.boolean, false),
    relationStore: types.optional(RelationStore, {
      relations: [],
    }),

    normalizationMode: types.optional(types.boolean, false),
    normalizationStore: types.optional(NormalizationStore, {
      normalizations: [],
    }),

    regions: types.array(Region),

    areas: types.map(Area),

    regionStore: types.optional(RegionStore, {
      regions: [],
    }),

    highlightedNode: types.maybeNull(types.safeReference(AllRegionsType)),
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },

    get list() {
      return getParent(self, 2);
    },

    get root() {
      console.log("ROOT", self, getParent(self), self.store, self.list);
      return self.list.root;
    },
  }))
  .actions(self => ({
    reinitHistory() {
      self.history = { targetPath: "../regions" };
    },

    setEdit(val) {
      self.editable = val;
    },

    setGroundTruth(value) {
      self.honeypot = value;
      getEnv(self).onGroundTruth(self.store, self, value);
    },

    sendUserGenerate() {
      self.sentUserGenerate = true;
    },

    setLocalUpdate(value) {
      self.localUpdate = value;
    },

    setDragMode(val) {
      self.dragMode = val;
    },

    updatePersonalKey(value) {
      self.pk = value;
    },

    setNormalizationMode(val) {
      self.normalizationMode = val;
    },

    setHighlightedNode(node) {
      // moved to selectArea and others
    },

    selectArea(area) {
      if (self.highlightedNode === area) return;
      // if (current) current.setSelected(false);
      self.unselectAll();
      self.highlightedNode = area;
      // area.setSelected(true);
      // @todo some backward compatibility, should be rewritten to state handling
      // @todo but there are some actions should be performed like scroll to region
      area.selectRegion && area.selectRegion();
      area.regions.forEach(r => r.mainValue.map(v => r.from_name.findLabel(v)).forEach(l => l.setSelected(true)));
    },

    unselectArea(area) {
      if (self.highlightedNode !== area) return;
      // area.setSelected(false);
      self.unselectAll();
    },

    unselectAreas() {
      const node = self.highlightedNode;
      const fn = node && node.afterUnselectRegion;
      self.highlightedNode = null;
      fn && fn();
    },

    unselectStates() {
      self.names.forEach(tag => tag.unselectAll && tag.unselectAll());
    },

    unselectAll() {
      self.unselectAreas();
      self.unselectStates();
    },

    removeArea(area) {
      destroy(area);
    },

    startRelationMode(node1) {
      self._relationObj = node1;
      self.relationMode = true;

      document.body.style.cursor = Constants.CHOOSE_CURSOR;
    },

    stopRelationMode() {
      document.body.style.cursor = Constants.DEFAULT_CURSOR;

      self._relationObj = null;
      self.relationMode = false;

      self.regionStore.unhighlightAll();
    },

    deleteAllRegions({ deleteReadOnly = false } = {}) {
      let { regions } = self.regionStore;

      if (deleteReadOnly === false) regions = regions.filter(r => r.readonly === false);

      regions.forEach(r => r.deleteRegion());
    },

    addRegion(reg) {
      // self.regionStore.addRegion(reg);
      self.regionStore.unselectAll(true);

      if (self.relationMode) {
        self.addRelation(reg);
        self.stopRelationMode();
      }
    },

    loadRegionState(region) {
      region.states &&
        region.states.forEach(s => {
          const mainViewTag = self.names.get(s.name);
          mainViewTag.unselectAll && mainViewTag.unselectAll();
          mainViewTag.copyState(s);
        });
    },

    unloadRegionState(region) {
      region.states &&
        region.states.forEach(s => {
          const mainViewTag = self.names.get(s.name);
          mainViewTag.unselectAll && mainViewTag.unselectAll();
          mainViewTag.perRegionCleanup && mainViewTag.perRegionCleanup();
        });
    },

    addRelation(reg) {
      self.relationStore.addRelation(self._relationObj, reg);
    },

    addNormalization(normalization) {
      self.normalizationStore.addNormalization();
    },

    validate() {
      let ok = true;

      self.traverseTree(function(node) {
        if (node.required === true) {
          ok = node.validate();
          if (ok === false) {
            ok = false;
            return TRAVERSE_STOP;
          }
        }
      });

      return ok;
    },

    traverseTree(cb) {
      return Tree.traverseTree(self.root, cb);
    },

    /**
     *
     */
    beforeSend() {
      self.traverseTree(node => {
        if (node && node.beforeSend) {
          node.beforeSend();
        }
      });

      self.stopRelationMode();
      self.regionStore.unselectAll();
    },

    /**
     * Delete region
     * @param {*} region
     */
    deleteRegion(region) {
      if (region.type === "polygonregion") {
        detach(region);
        return;
      }

      destroy(region);
    },

    afterAttach() {
      // initialize toName bindings [DOCS] name & toName are used to
      // connect different components to each other
      self.traverseTree(node => {
        if (node && node.name) self.names.put(node);

        if (node && node.toname) {
          const val = self.toNames.get(node.toname);
          if (val) {
            val.push(node.name);
          } else {
            self.toNames.set(node.toname, [node.name]);
          }
        }
      });

      self.traverseTree(node => {
        if (node.updateValue) node.updateValue(self.store);

        // called when the completion is attached to the main store,
        // at this point the whole tree is available. This method
        // may come handy when you have a tag that acts or depends
        // on other elements in the tree.
        if (node.completionAttached) node.completionAttached();

        // copy tools from control tags into object tools manager
        // [DOCS] each object tag may have an assigned tools
        // manager. This assignment may happen because user asked
        // for it through the config, or because the attached
        // control tags are complex and require additional UI
        // interfaces. Each control tag defines a set of tools it
        // supports
        if (node && node.getToolsManager) {
          const tools = node.getToolsManager();
          const states = self.toNames.get(node.name);

          states && states.forEach(s => tools.addToolsFromControl(s));
        }
      });
    },

    afterCreate() {
      //
      // debugger;
      if (self.userGenerate && !self.sentUserGenerate) {
        self.loadedDate = new Date();
      }

      // initialize toName bindings [DOCS] name & toName are used to
      // connect different components to each other
      // self.traverseTree(node => {
      //   if (node && node.name && node.id) self.names.set(node.name, node.id);

      //   if (node && node.toname && node.id) {
      //     const val = self.toNames.get(node.toname);
      //     if (val) {
      //       val.push(node.id);
      //     } else {
      //       self.toNames.set(node.toname, [node.id]);
      //     }
      //   }
      // });
    },

    setupHotKeys() {
      Hotkey.unbindAll();

      let audiosNum = 0;
      let audioNode = null;
      let mod = "shift+space";
      let comb = mod;

      // [TODO] we need to traverse this two times, fix
      // Hotkeys setup
      self.traverseTree(node => {
        if (node && node.onHotKey && node.hotkey) {
          Hotkey.addKey(node.hotkey, node.onHotKey, undefined, node.hotkeyScope);
        }
      });

      self.traverseTree(node => {
        // add Space hotkey for playbacks of audio, there might be
        // multiple audios on the screen
        if (node && !node.hotkey && (node.type === "audio" || node.type === "audioplus")) {
          if (audiosNum > 0) comb = mod + "+" + (audiosNum + 1);
          else audioNode = node;

          node.hotkey = comb;
          Hotkey.addKey(comb, node.onHotKey, "Play an audio");

          audiosNum++;
        }
      });

      self.traverseTree(node => {
        /**
         * Hotkey for controls
         */
        if (node && node.onHotKey && !node.hotkey) {
          const comb = Hotkey.makeComb();

          if (!comb) return;

          node.hotkey = comb;
          Hotkey.addKey(node.hotkey, node.onHotKey);
        }
      });

      if (audioNode && audiosNum > 1) {
        audioNode.hotkey = mod + "+1";
        Hotkey.addKey(audioNode.hotkey, audioNode.onHotKey);
        Hotkey.removeKey(mod);
      }

      // prevent spacebar from scrolling
      // document.onkeypress = function(e) {
      //     e = e || window.event;

      //   var charCode = e.keyCode || e.which;
      //   if (charCode === 32) {
      //     e.preventDefault();
      //     return false;
      //   }
      // };

      Hotkey.setScope("__main__");
    },

    // @todo rename to addRegion after clean up
    pushRegion(region) {
      self.regions.push(region);
    },

    createJustRegion(data) {
      const region = Region.create(data);
      self.regions.push(region);
    },

    createRegion({ type, ...data }, control, object) {
      const area = Area.create({
        id: guidGenerator(),
        // object: object,
        ...data,
      });

      const region = Region.create({
        area,
        from_name: control.name,
        to_name: object,
        type: control.type,
        value: {
          [control._type]: control.selectedValues(),
        },
      });

      self.areas.put(area);
      self.regions.push(region);

      // self.unselectAll();

      return area;
    },

    serializeCompletion() {
      return self.regions.map(r => r.serialize());
    },

    /**
     * Deserialize completion of models
     */
    deserializeCompletion(json) {
      // return;
      let objCompletion = json;

      // self.regions = objCompletion;
      console.log("REGIONS", self.regions);

      // resolveIdentifier(undefined, self.root, name);
      // return;

      if (typeof objCompletion !== "object") {
        objCompletion = JSON.parse(objCompletion);
      }

      self._initialCompletionObj = objCompletion;

      objCompletion.forEach(obj => {
        if (obj["type"] !== "relation") {
          const { id, value, type, ...data } = obj;
          // avoid duplicates of the same areas in different completions/predictions
          const areaId = `${id}#${self.id}`;
          const regionId = `${data.from_name}@${areaId}`;

          let area = self.areas.get(areaId);
          if (!area) {
            console.log("NEW AREA", areaId, { ...data, ...value });
            area = Area.create({ id: areaId, ...data, ...value });
            self.areas.put(area);
          }

          const region = Region.create({ ...data, id: regionId, type, value, area });
          self.regions.push(region);
          // const names = obj.to_name.split(",");
          // if (names.length > 1) throw new Error("Pairwise is not supported now");
          // names.forEach(name => {
          //   const toModel = self.names.get(name);
          //   if (!toModel) throw new Error("No model found for " + obj.to_name);

          //   const fromModel = self.names.get(obj.from_name);
          //   if (!fromModel) throw new Error("No model found for " + obj.from_name);

          //   toModel.fromStateJSON(obj, fromModel);
          // });
        }
      });

      objCompletion.forEach(obj => {
        if (obj["type"] === "relation") {
          self.relationStore.deserializeRelation(
            self.regionStore.findRegion(obj.from_id),
            self.regionStore.findRegion(obj.to_id),
            obj.direction,
            obj.labels,
          );
        }
      });

      // self.regionStore.unselectAll();
    },
  }));

export default types
  .model("CompletionStore", {
    selected: types.maybeNull(types.reference(Completion)),

    root: Types.allModelsTypes(),

    completions: types.array(Completion),
    predictions: types.array(Completion),

    viewingAllCompletions: types.optional(types.boolean, false),
    viewingAllPredictions: types.optional(types.boolean, false),
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },
  }))
  .volatile(self => ({
    // root: null,
  }))
  .actions(self => {
    function toggleViewingAll() {
      if (self.viewingAllCompletions || self.viewingAllPredictions) {
        self.completions.forEach(c => {
          c.selected = false;
          c.editable = false;
          c.regionStore.unselectAll();
        });

        self.predictions.forEach(c => {
          c.selected = false;
          c.regionStore.unselectAll();
        });
      } else {
        selectCompletion(self.completions[0].id);
      }
    }

    function toggleViewingAllPredictions() {
      self.viewingAllPredictions = !self.viewingAllPredictions;

      if (self.viewingAllPredictions) self.viewingAllCompletions = false;

      toggleViewingAll();
    }

    function toggleViewingAllCompletions() {
      self.viewingAllCompletions = !self.viewingAllCompletions;

      if (self.viewingAllCompletions) self.viewingAllPredictions = false;

      toggleViewingAll();
    }

    function unselectViewingAll() {
      self.viewingAllCompletions = false;
      self.viewingAllPredictions = false;
    }

    function selectItem(id, list) {
      unselectViewingAll();

      if (self.selected) self.selected.selected = false;

      const c = list.find(c => c.id === id);
      c.selected = true;
      self.selected = c;

      return c;
    }

    /**
     * Select completion
     * @param {*} id
     */
    function selectCompletion(id) {
      const { selected } = self;
      const c = selectItem(id, self.completions);

      c.editable = true;
      // c.setupHotKeys();

      getEnv(self).onSelectCompletion(c, selected);

      return c;
    }

    function selectPrediction(id) {
      const p = selectItem(id, self.predictions);
      // p.regionStore.unselectAll();

      return p;
    }

    function deleteCompletion(completion) {
      getEnv(self).onDeleteCompletion(self.store, completion);

      /**
       * MST destroy completion
       */
      destroy(completion);

      self.selected = null;
      /**
       * Select other completion
       */
      if (self.completions.length > 0) {
        self.selectCompletion(self.completions[0].id);
      }
    }

    function addItem(options) {
      const { user, config } = self.store;

      //
      if (!self.root) {
        // convert config to mst model
        const completionModel = Tree.treeToModel(config);
        const modelClass = Registry.getModelByTag(completionModel.type);

        self.root = modelClass.create(completionModel);
      }

      const id = options["id"];
      delete options["id"];

      //
      let node = {
        id: id || guidGenerator(5),
        // root: self.root,

        userGenerate: false,

        ...options,
      };

      if (user && !("createdBy" in node)) node["createdBy"] = user.displayName;

      //
      return Completion.create(node);
    }

    function addPrediction(options = {}) {
      options.editable = false;
      options.type = "prediction";

      const item = addItem(options);
      self.predictions.unshift(item);

      return item;
    }

    function addCompletion(options = {}) {
      options.type = "completion";

      const item = addItem(options);
      self.completions.unshift(item);

      return item;
    }

    function addCompletionFromPrediction(prediction) {
      const c = self.addCompletion({ userGenerate: true });
      const s = prediction._initialCompletionObj;

      // we need to iterate here and rename all ids, as those might
      // clash with the one in the prediction if used as a reference
      // somewhere
      s.forEach(r => {
        if ("id" in r) r["id"] = guidGenerator();
      });

      selectCompletion(c.id);
      c.deserializeCompletion(s);

      return c;
    }

    return {
      toggleViewingAllCompletions,
      toggleViewingAllPredictions,

      addPrediction,
      addCompletion,
      addCompletionFromPrediction,

      selectCompletion,
      selectPrediction,

      deleteCompletion,
    };
  });
