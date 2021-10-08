import { applySnapshot, getEnv, getSnapshot, onSnapshot, resolvePath, types } from "mobx-state-tree";

/**
 * Time Traveller
 */
const TimeTraveller = types
  .model("TimeTraveller", {
    undoIdx: 0,
    targetPath: "",
    skipNextUndoState: types.optional(types.boolean, false),

    createdIdx: 0,
  })
  .volatile(() => ({
    history: [],
    isFrozen: false,
  }))
  .views(self => ({
    get canUndo() {
      return self.undoIdx > 0;
    },
    get canRedo() {
      return self.undoIdx < self.history.length - 1;
    },
  }))
  .actions(self => {
    let targetStore;
    let snapshotDisposer;
    let updateHandlers = new Set();
    let freezingLockSet = new Set();
    let frozenChanges = false;

    function triggerHandlers() {
      updateHandlers.forEach(handler => handler());
    }

    return {
      freeze(key) {
        freezingLockSet.add(key);
        if (!self.isFrozen) {
          frozenChanges = false;
          self.isFrozen = true;
        }
      },

      unfreeze(key) {
        freezingLockSet.delete(key);
        self.isFrozen = freezingLockSet.size > 0;
        if (!self.isFrozen && frozenChanges) {
          self.recordNow();
        }
      },

      recordNow() {
        self.addUndoState(getSnapshot(targetStore));
      },

      onUpdate(handler) {
        updateHandlers.add(handler);
        return () => {
          updateHandlers.delete(handler);
        };
      },

      addUndoState(recorder) {
        if (self.isFrozen) {
          frozenChanges = true;
          return;
        }
        if (self.skipNextUndoState) {
          /**
           * Skip recording if this state was caused by undo / redo
           */
          self.skipNextUndoState = false;

          return;
        }

        self.history.splice(self.undoIdx + 1);
        self.history.push(recorder);
        self.undoIdx = self.history.length - 1;
        frozenChanges = false;
      },

      reinit() {
        self.history = [getSnapshot(targetStore)];
        self.undoIdx = 0;
        self.createdIdx = 0;
        triggerHandlers();
      },

      afterCreate() {
        targetStore = self.targetPath ? resolvePath(self, self.targetPath) : getEnv(self).targetStore;

        if (!targetStore)
          throw new Error(
            "Failed to find target store for TimeTraveller. Please provide `targetPath`  property, or a `targetStore` in the environment",
          );
        // start listening to changes
        snapshotDisposer = onSnapshot(targetStore, snapshot => this.addUndoState(snapshot));
        // record an initial state if no known
        if (self.history.length === 0) {
          self.recordNow();
        }

        self.createdIdx = self.undoIdx;
      },

      beforeDestroy() {
        snapshotDisposer();
      },

      undo() {
        self.set(self.undoIdx - 1);
      },

      redo() {
        self.set(self.undoIdx + 1);
      },

      set(idx) {
        self.undoIdx = idx;
        self.skipNextUndoState = true;
        applySnapshot(targetStore, self.history[idx]);
        triggerHandlers();
      },

      reset() {
        // just apply zero state; it would be added as a new hisory item
        applySnapshot(targetStore, self.history[self.createdIdx]);
        triggerHandlers();
      },
    };
  });

export default TimeTraveller;
