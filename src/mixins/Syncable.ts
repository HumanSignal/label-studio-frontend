import { Instance, types } from 'mobx-state-tree';

/**
 * Supress all additional events during this window in ms.
 * 100ms is too short to notice, but covers enough frames (~6) for back and forth events.
 */
export const SYNC_WINDOW = 100;

export type SyncEvent = string; // ex. "play" | "pause" | "seek" | "speed" | "volume"

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
   */
  sync(data: SyncData, event: SyncEvent, origin: string) {
    if (!this.locked || this.locked === origin) console.log('SYNC', { event, locked: this.locked, data, origin });

    // locking mechanism
    // let's try to also send events came from original tag even when sync window is locked
    if (this.locked && this.locked !== origin) return;
    if (!this.locked) setTimeout(() => this.locked = null, SYNC_WINDOW);
    this.locked = origin;

    for (const target of this.syncTargets.values()) {
      if (origin !== target.name) {
        target.syncReceive(data, event);
      }
    }
  }
}

export const SyncManagerFactory = {
  managers: new Map<string, SyncManager>(),
  get(name: string): SyncManager {
    if (!this.managers.has(name)) {
      this.managers.set(name, new SyncManager());
    }
    return this.managers.get(name)!;
  },
};

(global as any).syncManagers = SyncManagerFactory;

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
  /* eslint-enable @typescript-eslint/indent */
  .actions(self => ({
    afterCreate() {
      if (!self.sync) return;

      // @todo support sync by other tags' names for backward compatibility
      self.syncManager = SyncManagerFactory.get(self.sync);
      self.syncManager!.register(self as Instance<typeof SyncableMixin>);
      (self as Instance<typeof SyncableMixin>).registerSyncHandlers();
    },

    /**
    * Tag can add handlers to `syncHandlers` here
    */
    registerSyncHandlers() {},

    syncSend(data: SyncData, event: SyncEvent) {
      if (!self.sync) return;
      self.syncManager!.sync(data, event, self.name);
    },

    syncReceive(data: SyncData, event: SyncEvent) {
      const handler = self.syncHandlers.get(event);

      if (handler) {
        handler(data, event);
      }
    },

    destroy() {
      self.syncManager!.unregister(self as Instance<typeof SyncableMixin>);
    },
  }));

export { SyncableMixin };
