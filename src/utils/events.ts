type Callback = (...args: any[]) => any

export class Events {
  events = new Map<string, Set<Callback>>();

  on(eventName: string, callback: Callback) {
    const eventMap = this.getEventMap(eventName);

    if (!eventMap.has(callback)) {
      eventMap.add(callback);
    }
  }

  off(eventName: string, callback: Callback) {
    const eventMap = this.getEventMap(eventName);

    if (eventMap.has(callback)) {
      eventMap.delete(callback);
    }
  }

  removeAll(eventName: string) {
    const eventMap = this.getEventMap(eventName);

    eventMap.clear();
  }

  invoke(eventName: string, ...args: any[]) {
    const eventMap = this.getEventMap(eventName);

    if (eventMap.size > 0) {
      return Promise.all([...eventMap].map(fn => fn(...args)));
    }
  }

  invokeFirst(eventName: string, ...args: any[]) {
    const eventMap = this.getEventMap(eventName);

    if (eventMap.size > 0) {
      const items = Array.from(eventMap);

      return items[0](...args);
    }

    return undefined;
  }

  hasEvent(eventName: string) {
    return this.getEventMap(eventName).size > 0;
  }

  clear() {
    this.events.forEach(eventMap => eventMap.clear());
    this.events.clear();
  }

  private getEventMap(eventName: string) {
    let eventMap: Set<Callback>;

    if (this.events.has(eventName)) {
      eventMap = this.events.get(eventName)!;
    } else {
      eventMap = new Set<Callback>();
      this.events.set(eventName, eventMap);
    }

    return eventMap;
  }
}
