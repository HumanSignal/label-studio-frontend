import { Instance, types } from 'mobx-state-tree';

/**
 * Supress all additional events during this window in ms.
 * 100ms is too short to notice, but covers enough frames (~6) for back and forth events.
 */
export const SYNC_WINDOW = 100;

export type SyncEvent = string // ex. "play" | "pause" | "seek" | "speed" | "volume" | "mute"

export interface SyncTarget {
  name: string;
  sync: string;
  syncEvents: SyncEvent[];
  syncSend(event: SyncEvent, data: any): void;
  syncReceive(event: SyncEvent, data: any): void;
  destroy(): void;
}

export interface SyncDataFull {
  time: number;
  playing: boolean;
  speed: number;
}

export type SyncData = Partial<SyncDataFull>;

export class SyncManager {
  syncTargets = new Map<string, Instance<typeof SyncableMixin>>();
  locked: string | null = null; // refers to the main tag, which locked this sync

  register(syncTarget: Instance<typeof SyncableMixin>) {
    this.syncTargets.set(syncTarget.name, syncTarget);
  }

  unregister(syncTarget: SyncTarget) {
    this.syncTargets.delete(syncTarget.name);
    // @todo remove manager on empty set
  }

  /**
   * 
   * @todo event should be a supplementary info, not the main piece of info to react to
   * @param event
   * @param data 
   * @param origin 
   * @returns 
   */
  sync(event: SyncEvent, data: SyncData, origin: string) {
    console.log('SYNC', { event, locked: this.locked, data, origin });

    // locking mechanism
    // let's try to also send events came from original tag even when sync window is locked
    if (this.locked && this.locked !== origin) return;
    if (!this.locked) setTimeout(() => this.locked = null, SYNC_WINDOW);
    this.locked = origin;

    for (const target of this.syncTargets.values()) {
      if (origin !== target.name) {
        target.syncReceive(event, data);
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

export type SyncHandler = (event: string, data: SyncData) => void

interface SyncableProps {
  syncHandlers: Map<string, SyncHandler>;
  syncManager: SyncManager | null;
}

const SyncableMixin = types
  .model('SyncableMixin', {
    name: types.string,
    sync: types.optional(types.string, ''),
  })
  .volatile<SyncableProps>(() => ({
  syncHandlers: new Map<string, SyncHandler>(),
  syncManager: null,
}))
  .views(self => ({
    get syncEvents() {
      return Array.from(self.syncHandlers.keys());
    },
  }))
  .actions(self => ({
    afterCreate() {
      if (!self.sync) return;

      self.syncManager = SyncManagerFactory.get(self.sync);
      self.syncManager!.register(self as Instance<typeof SyncableMixin>);
      (self as Instance<typeof SyncableMixin>).registerSyncHandlers();
    },

    /**
    * Override register and assign the syncHandlers
    * 
    * @example
    * handlePlay = (data: any) => { }
    * 
    * protected register() {
    *   this.syncHandlers.set("play", this.handlePlay)
    * }
    */
    registerSyncHandlers() {
    },

    syncSend(event: SyncEvent, data: SyncData) {
      if (!self.sync) return;
      self.syncManager!.sync(event, data, self.name);
    },

    syncReceive(event: SyncEvent, data: SyncData) {
      const handler = self.syncHandlers.get(event);

      if (handler) {
        handler(event, data);
      }
    },

    destroy() {
      self.syncManager!.unregister(self as Instance<typeof SyncableMixin>);
    },
  }));

export { SyncableMixin };
