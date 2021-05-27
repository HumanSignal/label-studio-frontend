/* global LSF_VERSION */

import { types, getEnv } from "mobx-state-tree";

import AnnotationStore from "./AnnotationStore";
import { Hotkey } from "../core/Hotkey";
import InfoModal from "../components/Infomodal/Infomodal";
import Project from "./ProjectStore";
import Settings from "./SettingsStore";
import Task from "./TaskStore";
import User, { UserExtended } from "./UserStore";
import Utils from "../utils";
import { delay, isDefined } from "../utils/utilities";
import messages from "../utils/messages";
import { guidGenerator } from "../utils/unique";

const hotkeys = Hotkey("AppStore");

export default types
  .model("AppStore", {
    /**
     * XML config
     */
    config: types.string,

    /**
     * Task with data, id and project
     */
    task: types.maybeNull(Task),

    project: types.maybeNull(Project),

    /**
     * Configure the visual UI shown to the user
     */
    interfaces: types.array(types.string),

    /**
     * Flag for labeling of tasks
     */
    explore: types.optional(types.boolean, false),

    /**
     * Annotations Store
     */
    annotationStore: types.optional(AnnotationStore, {
      annotations: [],
      predictions: [],
      history: [],
    }),

    /**
     * User of Label Studio
     */
    user: types.maybeNull(User),

    /**
     * Debug for development environment
     */
    debug: types.optional(types.boolean, true),

    /**
     * Settings of Label Studio
     */
    settings: types.optional(Settings, {}),

    /**
     * Data of description flag
     */
    description: types.maybeNull(types.string),
    // apiCalls: types.optional(types.boolean, true),

    /**
     * Flag for settings
     */
    showingSettings: types.optional(types.boolean, false),
    /**
     * Flag
     * Description of task in Label Studio
     */
    showingDescription: types.optional(types.boolean, false),
    /**
     * Loading of Label Studio
     */
    isLoading: types.optional(types.boolean, false),
    /**
     * Submitting task; used to prevent from duplicating requests
     */
    isSubmitting: false,
    /**
     * Flag for disable task in Label Studio
     */
    noTask: types.optional(types.boolean, false),
    /**
     * Flag for no access to specific task
     */
    noAccess: types.optional(types.boolean, false),
    /**
     * Finish of labeling
     */
    labeledSuccess: types.optional(types.boolean, false),

    /**
     * Show or hide comments section
     */
    showComments: false,

    users: types.optional(types.array(UserExtended), [])
  })
  .volatile(() => ({
    version: typeof LSF_VERSION === "string" ? LSF_VERSION : "0.0.0",
    initialized: false,
  }))
  .views(self => ({
    /**
     * Get alert
     */
    get alert() {
      return getEnv(self).alert;
    },

    get hasSegmentation() {
      const match = Array.from(self.annotationStore.names.values()).map(({type}) => !!type.match(/labels/));
      return match.find(v => v === true) ?? false;
    },
  }))
  .actions(self => {
    /**
     * Update settings display state
     */
    function toggleSettings() {
      self.showingSettings = !self.showingSettings;
    }

    /**
     * Update description display state
     */
    function toggleDescription() {
      self.showingDescription = !self.showingDescription;
    }

    function setFlags(flags) {
      const names = [
        "showingSettings",
        "showingDescription",
        "isLoading",
        "isSubmitting",
        "noTask",
        "noAccess",
        "labeledSuccess",
      ];

      for (let n of names) if (n in flags) self[n] = flags[n];
    }

    /**
     * Check for interfaces
     * @param {string} name
     * @returns {string | undefined}
     */
    function hasInterface(name) {
      return self.interfaces.find(i => name === i) !== undefined;
    }

    function addInterface(name) {
      return self.interfaces.push(name);
    }

    function toggleComments(state) {
      return (self.showComments = state);
    }

    /**
     * Function
     */
    function afterCreate() {
      // important thing to detect Area atomatically: it hasn't access to store, only via global
      window.Htx = self;

      // Unbind previous keys in case LS was re-initialized
      hotkeys.unbindAll();

      /**
       * Hotkey for submit
       */
      if (self.hasInterface("submit")) hotkeys.addKey("ctrl+enter", self.submitAnnotation, "Submit a task");

      /**
       * Hotkey for skip task
       */
      if (self.hasInterface("skip")) hotkeys.addKey("ctrl+space", self.skipTask, "Skip a task");

      /**
       * Hotkey for update annotation
       */
      if (self.hasInterface("update")) hotkeys.addKey("alt+enter", self.updateAnnotation, "Update a task");

      /**
       * Hotkey for delete
       */
      hotkeys.addKey(
        "command+backspace, ctrl+backspace",
        function() {
          const { selected } = self.annotationStore;
          if (window.confirm(messages.CONFIRM_TO_DELETE_ALL_REGIONS)) {
            selected.deleteAllRegions();
          }
        },
        "Delete all regions",
      );

      // create relation
      hotkeys.addKey(
        "r",
        function() {
          const c = self.annotationStore.selected;
          if (c && c.highlightedNode && !c.relationMode) {
            c.startRelationMode(c.highlightedNode);
          }
        },
        "Create relation when region is selected",
      );

      // unselect region
      hotkeys.addKey("u", function() {
        const c = self.annotationStore.selected;
        if (c && !c.relationMode) {
          c.unselectAll();
        }
      });

      hotkeys.addKey("h", function() {
        const c = self.annotationStore.selected;
        if (c && c.highlightedNode && !c.relationMode) {
          c.highlightedNode.toggleHidden();
        }
      });

      hotkeys.addKey("command+z, ctrl+z", function() {
        const { history } = self.annotationStore.selected;
        history && history.canUndo && history.undo();
      });

      hotkeys.addKey("command+shift+z, ctrl+shift+z", function() {
        const { history } = self.annotationStore.selected;
        history && history.canRedo && history.redo();
      });

      hotkeys.addKey(
        "escape",
        function() {
          const c = self.annotationStore.selected;
          if (c && c.relationMode) {
            c.stopRelationMode();
          } else if (c && c.highlightedNode) {
            c.regionStore.unselectAll();
          }
        },
        "Unselect region, exit relation mode",
      );

      hotkeys.addKey(
        "backspace",
        function() {
          const c = self.annotationStore.selected;
          if (c && c.highlightedNode) {
            c.highlightedNode.deleteRegion();
          }
        },
        "Delete selected region",
      );

      hotkeys.addKey(
        "alt+tab",
        function() {
          const c = self.annotationStore.selected;
          c && c.regionStore.selectNext();
        },
        "Circle through entities",
      );

      getEnv(self).onLabelStudioLoad(self);
    }

    /**
     *
     * @param {*} taskObject
     */
    function assignTask(taskObject) {
      if (taskObject && !Utils.Checkers.isString(taskObject.data)) {
        taskObject = {
          ...taskObject,
          data: JSON.stringify(taskObject.data),
        };
      }
      self.task = Task.create(taskObject);
    }

    function assignConfig(config) {
      const cs = self.annotationStore;
      self.config = config;
      cs.initRoot(self.config);
    }

    /* eslint-disable no-unused-vars */
    function showModal(message, type = "warning") {
      InfoModal[type](message);

      // InfoModal.warning("You need to label at least something!");
    }
    /* eslint-enable no-unused-vars */

    function submitDraft(c) {
      return new Promise(resolve => {
        const fn = getEnv(self).onSubmitDraft;
        if (!fn) return resolve();
        const res = fn(self, c);
        if (res && res.then) res.then(resolve);
        else resolve(res);
      });
    }

    // Set `isSubmitting` flag to block [Submit] and related buttons during request
    // to prevent from sending duplicating requests.
    // Better to return request's Promise from SDK to make this work perfect.
    function handleSubmittingFlag(fn, defaultMessage = "Error during submit") {
      self.setFlags({ isSubmitting: true });
      const res = fn();
      // Wait for request, max 5s to not make disabled forever broken button;
      // but block for at least 0.5s to prevent from double clicking.
      Promise.race([Promise.all([res, delay(500)]), delay(5000)])
        .catch(err => showModal(err?.message || err || defaultMessage))
        .then(() => self.setFlags({ isSubmitting: false }));
    }

    function submitAnnotation() {
      const entity = self.annotationStore.selected;
      entity.beforeSend();

      if (!entity.validate()) return;

      entity.sendUserGenerate();
      handleSubmittingFlag(() => getEnv(self).onSubmitAnnotation(self, entity));
      entity.dropDraft();
      entity.saveSnapshot();
    }

    function updateAnnotation() {
      const entity = self.annotationStore.selected;
      entity.beforeSend();

      if (!entity.validate()) return;

      getEnv(self).onUpdateAnnotation(self, entity);
      entity.dropDraft();
      entity.saveSnapshot();
      !entity.sentUserGenerate && entity.sendUserGenerate();
    }

    function skipTask() {
      handleSubmittingFlag(() => getEnv(self).onSkipTask(self), "Error during skip, try again");
    }

    function acceptAnnotation() {
      handleSubmittingFlag(() => {
        const entity = self.annotationStore.selected;
        entity.beforeSend();
        if (!entity.validate()) return;

        const isDirty = entity.history.canUndo;
        entity.dropDraft();
        getEnv(self).onAcceptAnnotation(self, {isDirty, entity});
        entity.saveSnapshot();
      }, "Error during skip, try again");
    }

    function rejectAnnotation() {
      handleSubmittingFlag(() => {
        const entity = self.annotationStore.selected;
        entity.beforeSend();
        if (!entity.validate()) return;

        const isDirty = entity.history.canUndo;
        entity.dropDraft();
        getEnv(self).onRejectAnnotation(self, {isDirty, entity});
        entity.saveSnapshot();
      }, "Error during skip, try again");
    }

    /**
     * Reset annotation store
     */
    function resetState() {
      self.annotationStore = AnnotationStore.create({ annotations: [] });

      // const c = self.annotationStore.addInitialAnnotation();

      // self.annotationStore.selectAnnotation(c.id);
    }

    /**
     * Function to initilaze annotation store
     * Given annotations and predictions
     * `completions` is a fallback for old projects; they'll be saved as `annotations` anyway
     */
    function initializeStore({ annotations, completions, predictions, annotationHistory }) {
      const as = self.annotationStore;
      as.initRoot(self.config);

      // eslint breaks on some optional chaining https://github.com/eslint/eslint/issues/12822
      /* eslint-disable no-unused-expressions */
      (predictions ?? []).forEach(p => {
        const obj = as.addPrediction(p);
        as.selectPrediction(obj.id);
        obj.deserializeAnnotation(p.result);
      });

      [...(completions ?? []), ...(annotations ?? [])]?.forEach((c) => {
        const obj = as.addAnnotation(c);
        as.selectAnnotation(obj.id);
        obj.deserializeAnnotation(c.draft || c.result);
        obj.reinitHistory();
      });

      self.setHistory(annotationHistory);
      /* eslint-enable no-unused-expressions */

      if (!self.initialized) {
        self.initialized = true;
        getEnv(self).onStorageInitialized(self);
      }
    }

    function setHistory(history = []) {
      const as = self.annotationStore;

      as.clearHistory();

      (history ?? []).forEach(item => {
        const fixed = isDefined(item.fixed_annotation_history_result);
        const accepted = item.accepted;

        const obj = as.addHistory({
          ...item,
          pk: guidGenerator(),
          user: item.created_by,
          createdDate: item.created_at,
          acceptedState: accepted ? (fixed ? "fixed" : "accepted") : "rejected",
        });

        const result = item.previous_annotation_history_result ?? [];

        obj.deserializeAnnotation(result);
      });
    }

    return {
      setFlags,
      addInterface,
      hasInterface,

      afterCreate,
      assignTask,
      assignConfig,
      resetState,
      initializeStore,
      setHistory,

      skipTask,
      submitDraft,
      submitAnnotation,
      updateAnnotation,
      acceptAnnotation,
      rejectAnnotation,

      showModal,
      toggleComments,
      toggleSettings,
      toggleDescription,
    };
  });
