import { Instance, types } from 'mobx-state-tree';

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
  locks = new Map<string, boolean>();

  register(syncTarget: Instance<typeof SyncableMixin>) {
    this.syncTargets.set(syncTarget.name, syncTarget);
  }

  unregister(syncTarget: SyncTarget) {
    this.syncTargets.delete(syncTarget.name);
    // @todo remove manager on empty set
  }

  sync(event: SyncEvent, data: SyncData, ignore: string[] = []) {
    const locked = this.locks.get(event);

    console.log('SYNC', { event, locked, data, origin: ignore.join('/') });

    // locking mechanism
    if (locked) return;
    this.locks.set(event, true);
    window.requestAnimationFrame(() => this.locks.delete(event));

    for (const target of this.syncTargets.values()) {
      if (!ignore.includes(target.name)) { // && target.syncEvents.includes(event)) {
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
      self.syncManager!.sync(event, data, [self.name]);
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
