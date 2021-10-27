import { types } from "mobx-state-tree";

import { EventInvoker } from "../utils/events";

const SyncMixin = types
  .model({
    sync: types.maybeNull(types.string),
  })
  .volatile(() => ({
    events: new EventInvoker(),
    synced: false,
    syncedObject: null,
    currentEvent: null,
  }))
  .actions(self => ({
    // *** abstract ***
    handleSyncPlay() { console.error("handleSyncPlay should be implemented"); },
    handleSyncPause() { console.error("handleSyncPause should be implemented"); },
    handleSyncSeek() { console.error("handleSyncSeek should be implemented"); },

    _handleSyncSeek(time) {
      self.currentEvent = "seek";
      self.handleSyncSeek(time);
    },

    triggerSyncPlay() {
      self.events.invoke("play");
    },

    triggerSyncPause() {
      self.events.invoke("pause");
    },

    triggerSyncSeek(time) {
      if (self.currentEvent) {
        self.currentEvent = null;
        return;
      }

      self.events.invoke("seek", time);
    },

    initSync() {
      if (!self.synced) {
        self.synced = true;

        const object = self.annotation?.names?.get(self.sync);

        if (!object?.events) return;

        self.syncedObject = object;

        object.events.on("play", self.handleSyncPlay);
        object.events.on("pause", self.handleSyncPause);
        object.events.on("seek", self._handleSyncSeek);
      }
    },
  }));

export { SyncMixin };
