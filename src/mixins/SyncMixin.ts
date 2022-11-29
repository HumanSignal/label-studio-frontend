import { observe } from 'mobx';
import { types } from 'mobx-state-tree';

import { EventInvoker } from '../utils/events';
import { TimeSync, TimeSyncSubscriber } from '../utils/TimeSync';

interface SyncMixinProps {
  events: EventInvoker;
  synced: boolean;
  isCurrentlyPlaying: boolean;
  syncedObject: any;
  currentEvent: Set<string>;
  currentTime: number;
  timeSync: TimeSyncSubscriber | null;
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
}))
  .actions((self) => ({
    // *** abstract ***
    needsUpdate() {},
    handleSyncPlay() { console.error('handleSyncPlay should be implemented'); },
    handleSyncPause() { console.error('handleSyncPause should be implemented'); },
    handleSyncSeek() { console.error('handleSyncSeek should be implemented'); },
    handleSyncSpeed() { console.error('handleSyncSpeed should be implemented'); },
    attachObject() {
      self.syncedObject = (self as any).annotation?.names?.get(self.sync);
    },
  }))
  .actions(self => ({
    triggerSyncPlay() {
      self.timeSync?.play();
    },

    triggerSyncPause() {
      self.timeSync?.pause();
    },

    triggerSyncSeek(time: number) {
      self.timeSync?.seek(time);
    },

    triggerSyncSpeed(speed: number) {
      self.timeSync?.speed(speed);
    },

    afterAttach() {
      if (self.sync && self.sync !== (self as any).name) {
        const syncObject = sync.register((self as any).name);

        syncObject.subscribe(self.sync, {
          play: self.handleSyncPlay,
          pause: self.handleSyncPause,
          seek: self.handleSyncSeek,
          speed: self.handleSyncSpeed,
        });

        self.timeSync = syncObject;
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
  }));

export { SyncMixin };
