import { types, resolvePath, getEnv, onSnapshot, getSnapshot, applySnapshot } from "mobx-state-tree";

/**
 * Time Traveller
 */
const TimeTraveller = types
  .model("TimeTraveller", {
    undoIdx: 0,
    targetPath: "",
    skipNextUndoState: types.optional(types.boolean, false),

    createdIdx: 0,

    isFrozen: types.optional(types.boolean, false),
    frozenIdx: -1,
  })
  .volatile(self => ({
    history: [],
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

    function triggerHandlers() {
      updateHandlers.forEach(handler => handler());
    }

    return {
      freeze() {
        self.isFrozen = true;
        self.skipNextUndoState = true;
        self.frozenIdx = self.undoIdx;
      },

      onUpdate(handler) {
        updateHandlers.add(handler);
        return () => {
          updateHandlers.delete(handler);
        };
      },

      addUndoState(recorder) {
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
        // TODO: check if targetStore doesn't contain self
        // if (contains(targetStore, self)) throw new Error("TimeTraveller shouldn't be recording itself. Please specify a sibling as taret, not some parent")
        // start listening to changes
        snapshotDisposer = onSnapshot(targetStore, snapshot => this.addUndoState(snapshot));
        // record an initial state if no known
        if (self.history.length === 0) {
          self.addUndoState(getSnapshot(targetStore));
        }

        self.createdIdx = self.undoIdx;
      },

      beforeDestroy() {
        snapshotDisposer();
      },

      undo() {
        if (self.isFrozen && self.frozenIdx < self.undoIdx) return;

        let newIdx = self.undoIdx - 1;

        self.set(newIdx);
      },

      redo() {
        let newIdx = self.undoIdx + 1;

        self.set(newIdx);
      },

      set(idx) {
        self.undoIdx = idx;
        self.skipNextUndoState = true;
        applySnapshot(targetStore, self.history[idx]);
        triggerHandlers();
      },

      reset() {
        self.set(self.createdIdx);
      },
    };
  });

export default TimeTraveller;
