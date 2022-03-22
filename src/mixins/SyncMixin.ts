import { types } from "mobx-state-tree";

import { EventInvoker } from "../utils/events";

interface SyncMixinVolatile {
  events: EventInvoker;
  synced: boolean;
  syncedObject: any;
  currentEvent: string | null;
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
  .actions(() => ({
    // *** abstract ***
    handleSyncPlay() { console.error("handleSyncPlay should be implemented"); },
    handleSyncPause() { console.error("handleSyncPause should be implemented"); },
    handleSyncSeek(time: number) { console.error("handleSyncSeek should be implemented"); },
  }))
  .actions(self => ({
    _handleSyncPause() {
      self.currentEvent = "pause";
      self.handleSyncPause();
    },

    _handleSyncPlay() {
      self.currentEvent = "play";
      self.handleSyncPlay();
    },

    _handleSyncSeek(time: number) {
      self.currentEvent = "seek";
      self.handleSyncSeek(time);
    },

    _resetEvent(eventName: string) {
      if (self.currentEvent === eventName) {
        self.currentEvent = null;
        return true;
      }

      return false;
    },
  }))
  .actions(self => ({
    triggerSyncPlay() {
      if (self._resetEvent('play')) return;

      self.events.invoke("play");
    },

    triggerSyncPause() {
      if (self._resetEvent('pause')) return;

      self.events.invoke("pause");
    },

    triggerSyncSeek(time: number) {
      if (self._resetEvent('seek')) return;

      self.events.invoke("seek", time);
    },

    initSync() {
      if (!self.synced) {
        self.synced = true;

        const object = (self as any).annotation?.names?.get(self.sync);

        if (!object?.events) return;

        self.syncedObject = object;

        object.events.on("play", self._handleSyncPlay);
        object.events.on("pause", self._handleSyncPause);
        object.events.on("seek", self._handleSyncSeek);
      }
    },
  }));

export { SyncMixin };
