import { observe } from "mobx";
import { types } from "mobx-state-tree";

import { EventInvoker } from "../utils/events";
import { TimeSync, TimeSyncSubscriber } from "../utils/TimeSync";

interface SyncMixinProps {
  events: EventInvoker;
  synced: boolean;
  isCurrentlyPlaying: boolean;
  syncedObject: any;
  currentEvent: Set<string>;
  currentTime: number;
  timeSync: TimeSyncSubscriber | null;
  syncedDuration: number;
  currentSpeed: number;
}

const sync = TimeSync.getInstance();

const SyncMixin = types
  .model({
    sync: types.maybeNull(types.string),
  })
  .volatile<SyncMixinProps>(() => ({
  events: new EventInvoker(),
  synced: false,
  isCurrentlyPlaying: false,
  syncedObject: null,
  currentEvent: new Set(),
  currentTime: 0,
  timeSync: null,
  syncedDuration: 0,
  currentSpeed: 1,
}))
  .actions((self) => ({
    // *** abstract ***
    needsUpdate() {},
    handleSyncPlay() { console.error("handleSyncPlay should be implemented"); },
    handleSyncPause() { console.error("handleSyncPause should be implemented"); },
    handleSyncSeek(time: number) { console.error("handleSyncSeek should be implemented"); },
    handleSyncSpeed(speed: number) { console.error("handleSyncSpeed should be implemented"); },
    attachObject() {
      self.syncedObject = (self as any).annotation?.names?.get(self.sync);
    },
    setCurrentlyPlaying(isPlaying: boolean) { console.error("setCurrentlyPlaying should be implemented"); },
  }))
  .actions(self => ({
    triggerSyncPlay() {
      self.setCurrentlyPlaying(true);
      self.timeSync?.play();
    },

    triggerSyncPause() {
      self.setCurrentlyPlaying(false);
      self.timeSync?.pause();
    },

    triggerSyncSeek(time: number) {
      console.log("time", time);
      self.currentTime = time;
      self.timeSync?.seek(time);
    },

    triggerSyncSpeed(speed: number) {
      console.log("time", speed);
      self.currentSpeed = speed;
      self.timeSync?.speed(speed);
    },

    afterAttach() {
      if (self.sync && self.sync !== (self as any).name) {
        console.log("afterAttach", self, (self as any)?.type, (self as any)?.name, (self as any)?.ref);
        const syncObject = sync.register((self as any).name);


        syncObject.subscribe(self.sync, {
          play: self.handleSyncPlay,
          pause: self.handleSyncPause,
          seek: self.handleSyncSeek,
          speed: self.handleSyncSpeed,
        });

        self.timeSync = syncObject;
        // self.syncedDuration = Math.min(...Array.from(sync.members).map(member => member[1]?.duration ?? 0));
      }

      const dispose = observe(self as any, 'annotation', () => {
        if ((self as any).annotation) {
          self.attachObject();
          self.needsUpdate?.();
          dispose();
        }
      }, true);
    },

    beforeDestroy(){
      if (self.timeSync && self.sync) {
        self.timeSync.unsubscribe(self.sync);
        sync.unregister((self as any).name);
      }
    },
    
    setSyncedDuration(duration: number) {
      if(self.syncedDuration === 0 || duration < self.syncedDuration) {
        console.log("setSyncedDuration", duration, self.syncedDuration, (self as any).name);
        self.syncedDuration = duration;
        if (self.syncedObject) {
          self.syncedObject.setSyncedDuration(duration);
        }
      }

    },
    setCurrentlyPlaying(isPlaying: boolean) {
      self.isCurrentlyPlaying = isPlaying;
      if (self.syncedObject) {
        isPlaying ? self.syncedObject.triggerSyncPlay() : self.syncedObject.triggerSyncPause();
      }
    },
  }));

export { SyncMixin };
