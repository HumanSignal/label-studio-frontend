import { Instance, types } from 'mobx-state-tree';

/**
 * Supress all additional events during this window in ms.
 * 100ms is too short to notice, but covers enough frames (~6) for back and forth events.
 */
export const SYNC_WINDOW = 100;

export type SyncEvent = 'play' | 'pause' | 'seek' | 'speed';

/**
 * Currently only for reference, MST mixins don't allow to apply this interface
 */
export interface SyncTarget {
  name: string;
  sync: string;
  syncSend(data: SyncData, event: SyncEvent): void;
  syncReceive(data: SyncData, event: SyncEvent): void;
  registerSyncHandlers(): void;
  destroy(): void;
}

export interface SyncDataFull {
  time: number;
  playing: boolean;
  speed: number;
}

export type SyncData = Partial<SyncDataFull>;

/**
 * Sync group of tags with each other; every tag should be registered
 */
export class SyncManager {
  syncTargets = new Map<string, Instance<typeof SyncableMixin>>();
  locked: string | null = null; // refers to the main tag, which locked this sync

  register(syncTarget: Instance<typeof SyncableMixin>) {
    this.syncTargets.set(syncTarget.name, syncTarget);
  }

  unregister(syncTarget: Instance<typeof SyncableMixin>) {
    this.syncTargets.delete(syncTarget.name);
    // @todo remove manager on empty set
  }

  /**
   * Sync `origin` state (in `data`) to connected tags.
   * No back-sync to origin of the event.
   * During SYNC_WINDOW only events from origin are processed, others are skipped
   * @param {SyncData} data state to sync between connected tags
   * @param {string} event name of event, supplementary info, actions should rely on data
   * @param {string} origin name of the tag triggered event
   * @returns {boolean} false if event was suppressed, because it's inside other event sync window
   */
  sync(data: SyncData, event: SyncEvent, origin: string) {
    // @todo remove
    if (!this.locked || this.locked === origin) console.log('SYNC', { event, locked: this.locked, data, origin });

    // locking mechanism
    // let's try to also send events came from original tag even when sync window is locked
    if (this.locked && this.locked !== origin) return false;
    if (!this.locked) setTimeout(() => this.locked = null, SYNC_WINDOW);
    this.locked = origin;

    for (const target of this.syncTargets.values()) {
      if (origin !== target.name) {
        target.syncReceive(data, event);
      }
    }
    return true;
  }
}

export const SyncManagerFactory = {
  managers: new Map<string, SyncManager>(),

  /**
   * Retrieve or create SyncManager
   * @param name sync manager's name, can be any string
   * @param fallbackName previously `sync` attrs of two tags were referring their respective names;
   *                     for backward compatibility these names can be passed here,
   *                     so the first tag will create manager by the name of the second tag
   *                     and the second tag will get this manager by the name of this tag.
   * @returns SyncManager
   */
  get(name: string, fallbackName?: string): SyncManager {
    let manager = this.managers.get(name);

    if (!manager && fallbackName) manager = this.managers.get(fallbackName);

    if (!manager) {
      manager = new SyncManager();
      this.managers.set(name, manager);
    }

    return manager;
  },
};

export type SyncHandler = (data: SyncData, event: string) => void

interface SyncableProps {
  syncHandlers: Map<string, SyncHandler>;
  syncManager: SyncManager | null;
}

/**
 * Tag should override `registerSyncHandlers()` or `syncReceive()` to handle sync events.
 * To trigger sync events internal methods should call `syncSend()`.
 * Should be used before ObjectBase to not break FF_DEV_3391.
 */
const SyncableMixin = types
  .model('SyncableMixin', {
    name: types.string,
    sync: types.optional(types.string, ''),
  })
  /* eslint-disable @typescript-eslint/indent */
  .volatile<SyncableProps>(() => ({
    syncHandlers: new Map(),
    syncManager: null,
  }))
  .actions(() => ({
    syncMuted(_muted: boolean) {
      // should be overriden in models, that can be and should be muted
      // self.muted = muted;
    },
  }))
  /* eslint-enable @typescript-eslint/indent */
  .actions(self => ({
    afterCreate() {
      if (!self.sync) return;

      self.syncManager = SyncManagerFactory.get(self.sync, self.name);
      self.syncManager!.register(self as Instance<typeof SyncableMixin>);
      (self as Instance<typeof SyncableMixin>).registerSyncHandlers();
    },

    /**
    * Tag can add handlers to `syncHandlers` here
    */
    registerSyncHandlers() {},

    syncSend(data: SyncData, event: SyncEvent) {
      if (!self.sync) return;
      const notSuppressed = self.syncManager!.sync(data, event, self.name);

      if (notSuppressed && event === 'play') {
        self.syncMuted(false);
      }
    },

    syncReceive(data: SyncData, event: SyncEvent) {
      const handler = self.syncHandlers.get(event);

      if (event === 'play') {
        self.syncMuted(true);
      }

      if (handler) {
        handler(data, event);
      }
    },

    destroy() {
      self.syncManager!.unregister(self as Instance<typeof SyncableMixin>);
    },
  }));

export { SyncableMixin };
