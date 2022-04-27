import { destroy, getEnv, getParent, getRoot, types } from "mobx-state-tree";

import { Hotkey } from "../../core/Hotkey";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import Utils from "../../utils";
import { guidGenerator } from "../../core/Helpers";
import { DataValidator, ValidationError, VALIDATORS } from "../../core/DataValidator";
import { errorBuilder } from "../../core/DataValidator/ConfigValidator";
import { ViewModel } from "../../tags/visual";
import { FF_DEV_1621, isFF } from "../../utils/feature-flags";
import { Annotation } from "./Annotation";
import { HistoryItem } from "./HistoryItem";

const SelectedItem = types.union(Annotation, HistoryItem);

export default types
  .model("AnnotationStore", {
    selected: types.maybeNull(types.reference(SelectedItem)),
    selectedHistory: types.maybeNull(types.safeReference(SelectedItem)),

    root: Types.allModelsTypes(),
    names: types.map(types.reference(Types.allModelsTypes())),
    toNames: types.map(types.array(types.reference(Types.allModelsTypes()))),

    annotations: types.array(Annotation),
    predictions: types.array(Annotation),
    history: types.array(HistoryItem),

    viewingAllAnnotations: types.optional(types.boolean, false),
    viewingAllPredictions: types.optional(types.boolean, false),

    validation: types.maybeNull(types.array(ValidationError)),
  })
  .views(self => ({
    get store() {
      return getRoot(self);
    },

    get viewingAll() {
      return self.viewingAllAnnotations || self.viewingAllPredictions;
    },
  }))
  .actions(self => {
    function toggleViewingAll() {
      if (self.viewingAllAnnotations || self.viewingAllPredictions) {
        if (self.selected) {
          self.selected.unselectAll();
          self.selected.selected = false;
        }

        self.annotations.forEach(c => {
          c.editable = false;
        });
      } else {
        selectAnnotation(self.annotations[0].id);
      }
    }

    function toggleViewingAllPredictions() {
      self.viewingAllPredictions = !self.viewingAllPredictions;

      if (self.viewingAllPredictions) self.viewingAllAnnotations = false;

      toggleViewingAll();
    }

    function toggleViewingAllAnnotations() {
      self.viewingAllAnnotations = !self.viewingAllAnnotations;

      if (self.viewingAllAnnotations) self.viewingAllPredictions = false;

      toggleViewingAll();
    }

    function unselectViewingAll() {
      self.viewingAllAnnotations = false;
      self.viewingAllPredictions = false;
    }

    function _unselectAll() {
      if (self.selected) {
        self.selected.unselectAll();
        self.selected.selected = false;
      }
    }

    function _selectItem(item) {
      self._unselectAll();
      item.editable = false;
      item.selected = true;
      self.selected = item;
      item.updateObjects();
    }

    function selectItem(id, list) {
      unselectViewingAll();

      self._unselectAll();

      // sad hack with pk while sdk are not using pk everywhere
      const c = list.find(c => c.id === id || c.pk === String(id)) || list[0];

      if (!c) return null;
      c.selected = true;
      self.selected = c;
      c.updateObjects();
      if (c.type === "annotation") c.setInitialValues();

      return c;
    }

    /**
     * Select annotation
     * @param {*} id
     */
    function selectAnnotation(id) {
      if (!self.annotations.length) return null;

      const { selected } = self;
      const c = selectItem(id, self.annotations);

      c.editable = true;
      c.setupHotKeys();

      getEnv(self).events.invoke('selectAnnotation', c, selected);
      if (c.pk) getParent(self).addAnnotationToTaskHistory(c.pk);
      return c;
    }

    function selectPrediction(id) {
      const p = selectItem(id, self.predictions);

      return p;
    }

    function deleteAnnotation(annotation) {
      getEnv(self).events.invoke('deleteAnnotation', self.store, annotation);

      /**
       * MST destroy annotation
       */
      destroy(annotation);

      self.selected = null;
      /**
       * Select other annotation
       */
      if (self.annotations.length > 0) {
        self.selectAnnotation(self.annotations[0].id);
      }
    }

    function showError(err) {
      if (err) self.addErrors([errorBuilder.generalError(err)]);
      // we have to return at least empty View to display interface
      return (self.root = ViewModel.create({ id: "error" }));
    }

    function initRoot(config) {
      if (self.root) return;

      if (!config) {
        return (self.root = ViewModel.create({ id:"empty" }));
      }

      // convert config to mst model
      let rootModel;

      try {
        rootModel = Tree.treeToModel(config, self.store);
      } catch (e) {
        console.error(e);
        return showError(e);
      }
      const modelClass = Registry.getModelByTag(rootModel.type);
      // hacky way to get all the available object tag names
      const objectTypes = Registry.objectTypes().map(type => type.name.replace("Model", "").toLowerCase());
      const objects = [];

      self.validate(VALIDATORS.CONFIG, rootModel);

      try {
        self.root = modelClass.create(rootModel);
      } catch (e) {
        console.error(e);
        return showError(e);
      }

      Tree.traverseTree(self.root, node => {
        if (node?.name) {
          self.names.put(node);
          if (objectTypes.includes(node.type)) objects.push(node.name);
        }
      });

      // initialize toName bindings [DOCS] name & toName are used to
      // connect different components to each other
      Tree.traverseTree(self.root, node => {
        const isControlTag = node.name && !objectTypes.includes(node.type);
        // auto-infer missed toName if there is only one object tag in the config

        if (isControlTag && !node.toname && objects.length === 1) {
          node.toname = objects[0];
        }

        if (node && node.toname) {
          const val = self.toNames.get(node.toname);

          if (val) {
            val.push(node.name);
          } else {
            self.toNames.set(node.toname, [node.name]);
          }
        }

        if (self.store.task && node.updateValue) node.updateValue(self.store);
      });

      return self.root;
    }

    function findNonInteractivePredictionResults() {
      return self.predictions.reduce((results, prediction) => {
        return [
          ...results,
          ...prediction._initialAnnotationObj.filter(result => result.interactive_mode === false).map(r => ({ ...r })),
        ];
      }, []);
    }

    function createItem(options) {
      const { user, config } = self.store;

      if (!self.root) initRoot(config);

      const pk = options.pk || options.id;

      //
      const node = {
        userGenerate: false,
        createdDate: Utils.UDate.currentISODate(),

        ...options,

        // id is internal so always new to prevent collisions
        id: guidGenerator(5),
        // pk and id may be missing, so undefined | string
        pk: pk && String(pk),
        root: self.root,
      };

      if (user && !("createdBy" in node)) node["createdBy"] = user.displayName;
      if (options.user) node.user = options.user;

      return node;
    }

    function addPrediction(options = {}) {
      options.editable = false;
      options.type = "prediction";

      const item = createItem(options);

      self.predictions.unshift(item);

      const record = self.predictions[0];

      return record;
    }

    function addAnnotation(options = {}) {
      options.type = "annotation";

      const item = createItem(options);

      if (item.userGenerate) {
        item.completed_by = getRoot(self).user?.id ?? undefined;
      }

      self.annotations.unshift(item);

      const record = self.annotations[0];

      record.addVersions({
        result: options.result,
        draft: options.draft,
      });

      return record;
    }

    function createAnnotation(options = { userGenerate: true }) {
      const result = isFF(FF_DEV_1621) ? findNonInteractivePredictionResults() : [];
      const c = self.addAnnotation({ ...options, result });

      if (result && result.length) {
        const ids = {};

        // Area id is <uniq-id>#<annotation-id> to be uniq across all tree
        result.forEach(r => {
          if ("id" in r) {
            const id = r.id.replace(/#.*$/, `#${c.id}`);

            ids[r.id] = id;
            r.id = id;
          }
        });

        result.forEach(r => {
          if (r.parent_id) {
            if (ids[r.parent_id]) r.parent_id = ids[r.parent_id];
            // impossible case but to not break the app better to reset it
            else r.parent_id = null;
          }
        });

        selectAnnotation(c.id);
        c.deserializeAnnotation(result);
        // reinit will trigger `updateObjects()` so we omit it here
        c.reinitHistory();
      } else {
        c.setDefaultValues();
      }
      return c;
    }


    function addHistory(options = {}) {
      options.type = "history";

      const item = createItem(options);

      self.history.push(item);

      const record = self.history[self.history.length - 1];

      return record;
    }

    function clearHistory() {
      self.history.forEach(item => destroy(item));
      self.history.length = 0;
    }

    function selectHistory(item) {
      self.selectedHistory = item;
      setTimeout(() => {
        // update classifications after render
        const updatedItem = item ?? self.selected;

        updatedItem?.results
          .filter(r => r.area.classification)
          .forEach(r => r.from_name.updateFromResult?.(r.mainValue));
      });
    }

    function addAnnotationFromPrediction(entity) {
      // immutable work, because we'll change ids soon
      const s = entity._initialAnnotationObj.map(r => ({ ...r }));
      const c = self.addAnnotation({ userGenerate: true, result: s });

      const ids = {};

      // Area id is <uniq-id>#<annotation-id> to be uniq across all tree
      s.forEach(r => {
        if ("id" in r) {
          const id = r.id.replace(/#.*$/, `#${c.id}`);

          ids[r.id] = id;
          r.id = id;
        }
      });

      s.forEach(r => {
        if (r.parent_id) {
          if (ids[r.parent_id]) r.parent_id = ids[r.parent_id];
          // impossible case but to not break the app better to reset it
          else r.parent_id = null;
        }
      });

      selectAnnotation(c.id);
      c.deserializeAnnotation(s);
      // reinit will trigger `updateObjects()` so we omit it here
      c.reinitHistory();

      // parent link for the new annotations
      if (entity.pk) {
        if (entity.type === 'prediction') {
          c.parent_prediction = parseInt(entity.pk);
        }
        else if (entity.type === 'annotation') {
          c.parent_annotation = parseInt(entity.pk);
        }
      }

      return c;
    }

    /** ERRORS HANDLING */
    const handleErrors = errors => {
      self.addErrors(errors);
    };

    const addErrors = errors => {
      const ids = [];

      const newErrors = [...(self.validation ?? []), ...errors].reduce((res, error) => {
        const id = error.identifier;

        if (ids.indexOf(id) < 0) {
          ids.push(id);
          res.push(error);
        }

        return res;
      }, []);

      self.validation = newErrors;
    };

    const afterCreate = () => {
      self._validator = new DataValidator();
      self._validator.addErrorCallback(handleErrors);
    };

    const beforeDestroy = () => {
      self._validator.removeErrorCallback(handleErrors);
    };

    const validate = (validatorName, data) => {
      return self._validator.validate(validatorName, data);
    };

    return {
      afterCreate,
      beforeDestroy,

      toggleViewingAllAnnotations,
      toggleViewingAllPredictions,

      initRoot,

      addPrediction,
      addAnnotation,
      createAnnotation,
      addAnnotationFromPrediction,
      addHistory,
      clearHistory,
      selectHistory,

      addErrors,
      validate,

      selectAnnotation,
      selectPrediction,

      _selectItem,
      _unselectAll,

      deleteAnnotation,
    };
  });
