import { types } from "mobx-state-tree";

import { EventInvoker } from "../utils/events";

interface SyncMixinVolatile {
  events: EventInvoker;
  synced: boolean;
  syncedObject: any;
  currentEvent: any;
}

const SyncMixin = types
  .model({
    sync: types.maybeNull(types.string),
  })
  .volatile<SyncMixinVolatile>(() => ({
  events: new EventInvoker(),
  synced: false,
  syncedObject: null,
  currentEvent: null,
}))
  .actions(self => ({
    // *** abstract ***
    handleSyncPlay(time: number) { console.error("handleSyncPlay should be implemented"); },
    handleSyncPause(time: number) { console.error("handleSyncPause should be implemented"); },
    handleSyncSeek(time: number) { console.error("handleSyncSeek should be implemented"); },
  }))
  .actions(self => ({
    _handleSyncSeek(time: number) {
      self.currentEvent = "seek";
      self.handleSyncSeek(time);
    },
  }))
  .actions(self => ({
    triggerSyncPlay() {
      self.events.invoke("play");
    },

    triggerSyncPause() {
      self.events.invoke("pause");
    },

    triggerSyncSeek(time: number) {
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
