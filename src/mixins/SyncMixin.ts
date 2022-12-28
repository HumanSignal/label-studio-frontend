import { observe } from 'mobx';
import { types } from 'mobx-state-tree';

import { EventInvoker } from '../utils/events';
import { FF_DEV_2715, isFF } from '../utils/feature-flags';
import { TimeSync, TimeSyncSubscriber } from '../utils/TimeSync';

const isFFDev2715 = isFF(FF_DEV_2715);

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
  .actions(self => ({
    // *** abstract ***
    needsUpdate() {},
    handleSyncPlay() {
      console.error('handleSyncPlay should be implemented');
    },
    handleSyncPause() {
      console.error('handleSyncPause should be implemented');
    },
    handleSyncSeek(_time: number) {
      console.error('handleSyncSeek should be implemented');
    },
    handleSyncSpeed(_speed: number) {
      console.error('handleSyncSpeed should be implemented');
    },
    handleSyncDuration(_duration: number) {
      if (isFFDev2715) {
        console.error('handleSyncDuration should be implemented');
      }
    },
    attachObject() {
      self.syncedObject = (self as any).annotation?.names?.get(self.sync);
    },
    setCurrentlyPlaying(_isPlaying: boolean) {
      if (isFFDev2715) {
        console.error('setCurrentlyPlaying should be implemented');
      }
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
      self.currentTime = time;
      self.timeSync?.seek(time);
    },

    triggerSyncSpeed(speed: number) {
      self.currentSpeed = speed;
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
          syncedDuration: self.handleSyncDuration,
        });

        self.timeSync = syncObject;
      }

      const dispose = observe(
        self as any,
        'annotation',
        () => {
          if ((self as any).annotation) {
            self.attachObject();
            self.needsUpdate?.();
            dispose();
          }
        },
        true,
      );
    },

    beforeDestroy() {
      if (self.timeSync && self.sync) {
        self.timeSync.unsubscribe(self.sync);
        sync.unregister((self as any).name);
      }
    },

    setSyncedDuration(duration: number) {
      if (self.syncedDuration === 0 || duration < self.syncedDuration) {
        self.syncedDuration = duration;
        self.timeSync?.syncedDuration(duration);
      }
    },

    setCurrentlyPlaying(isPlaying: boolean) {
      self.isCurrentlyPlaying = isPlaying;
      isPlaying ? self.timeSync?.play() : self.timeSync?.pause();
    },
  }));

export { SyncMixin };
