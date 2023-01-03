import { EventInvoker } from './events';
import { FF_DEV_2461, FF_DEV_2715, isFF } from './feature-flags';

const isFFDev2461 = isFF(FF_DEV_2461);
const isFFDev2715 = isFF(FF_DEV_2715);

let instance: TimeSync;

interface TimeSyncHandler {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  speed: (speed: number) => void;
  syncedDuration: (duration: number) => void;
}

type TimeSyncEvent = 'play' | 'pause' | 'seek' | 'speed' | 'syncedDuration';

export class TimeSyncSubscriber {
  private name: string;
  private sync: TimeSync;
  private lockedEvents: Set<TimeSyncEvent> = new Set();
  private events = new EventInvoker();
  private object: any;

  playing = false;
  currentTime = 0;
  currentSpeed = 1;
  duration = 0;

  constructor(name: string, sync: TimeSync, object: any) {
    this.name = name;
    this.sync = sync;
    this.object = object;
  }

  get subscribers(): TimeSyncSubscriber[] {
    const result = Array.from(this.sync.subscriptions.entries())
      .filter(([_, subs]) => subs.has(this.name))
      .map(([name]) => this.sync.members.get(name))
      .filter(member => member !== undefined);

    return result as TimeSyncSubscriber[];
  }

  on(name: string, cb: (...args: any[]) => void) {
    this.events.on(name, cb);
  }

  off(name: string, cb: (...args: any[]) => void) {
    this.events.off(name, cb);
  }

  subscribe(target: string, events: TimeSyncHandler, onReady?: () => void) {
    this.sync.subscribe(this.name, target, events, onReady);

    // Initial sync
    this.currentTime = this.sync.members.get(target)?.currentTime ?? this.currentTime;
    this.currentSpeed = this.sync.members.get(target)?.currentSpeed ?? this.currentSpeed;
    this.playing = this.sync.members.get(target)?.playing ?? this.playing;
    this.duration = this.sync.members.get(target)?.duration ?? this.duration;
  }

  unsubscribe(target: string) {
    this.sync.unsubscribe(this.name, target);
  }

  play() {
    this.playing = true;

    this.whenUnlocked('play', () => {
      this.events.invoke('play');
      this.subscribers.forEach(sub => sub.play());
    });
  }

  pause() {
    this.playing = false;

    this.whenUnlocked('pause', () => {
      this.events.invoke('pause');
      this.subscribers.forEach(sub => sub.pause());
    });
  }

  seek(time: number) {
    if ((!isFFDev2461 || !isFFDev2715) && time === this.currentTime) {
      this.releaseEvent('seek');
      return;
    }
    this.currentTime = time;

    this.whenUnlocked('seek', () => {
      this.events.invoke('seek', time);
      this.subscribers.forEach(sub => sub.seek(this.currentTime));
    });
  }

  speed(speed: number) {
    this.currentSpeed = speed;

    this.whenUnlocked('speed', () => {
      this.events.invoke('speed', speed);
      this.subscribers.forEach(sub => sub.speed(this.currentSpeed));
    });
  }

  syncedDuration(duration: number) {
    this.duration = duration;

    this.whenUnlocked('syncedDuration', () => {
      this.events.invoke('syncedDuration', duration);
      this.subscribers.forEach(sub => sub.syncedDuration(this.duration));
    });
  }

  private lockEvent(event: TimeSyncEvent) {
    this.lockedEvents.add(event);
  }

  private releaseEvent(event: TimeSyncEvent) {
    this.lockedEvents.delete(event);
  }

  private whenUnlocked(event: TimeSyncEvent, fn: () => void) {
    if (this.lockedEvents.has(event)) {
      if (!isFFDev2461 || !isFFDev2715) {
        this.releaseEvent(event);
      }
      return;
    }

    this.lockEvent(event);
    fn();
    if (isFFDev2461 || isFFDev2715) {
      this.releaseEvent(event);
    }
  }
}

export class TimeSync {
  static getInstance() {
    if (instance) {
      return instance;
    }

    return (instance = new TimeSync());
  }

  members = new Map<string, TimeSyncSubscriber>();
  subscriptions = new Map<string, Set<string>>();

  private events = new EventInvoker();
  private eventsCache = new Map<string, TimeSyncHandler[]>();

  register(name: string, object?: any) {
    const member = new TimeSyncSubscriber(name, this, object);

    this.members.set(name, member);

    const evts = this.eventsCache.get(name) ?? [];

    if (evts.length > 0) {
      evts.forEach(evt => {
        Object.entries(evt).forEach(([event, cb]) => {
          member.on(event, cb);
        });
      });

      this.eventsCache.set(name, []);
    }

    this.events.invoke(`ready:${name}`);

    return member;
  }

  unregister(name: string) {
    this.members.delete(name);
  }

  subscribe(name: string, target: string, events: TimeSyncHandler, onReady?: () => void) {
    const subs = this.subscriptions.get(name) ?? new Set();

    subs.add(target);

    this.subscriptions.set(name, subs);

    const member = this.members.get(target);

    if (member) {
      Object.entries(events).forEach(([event, cb]) => {
        member.on(event, cb);
      });
      onReady?.();

      return;
    }

    const evts = this.eventsCache.get(target) ?? [];

    evts.push(events);

    this.eventsCache.set(target, evts);

    if (onReady) {
      const handleReady = () => {
        this.events.off(`ready:${target}`, handleReady);
        onReady();
      };

      this.events.on(`ready:${target}`, handleReady);
    }
  }

  unsubscribe(name: string, target: string) {
    const subs = this.subscriptions.get(name) ?? new Set();

    subs.delete(target);

    this.subscriptions.set(name, subs);
  }
}
