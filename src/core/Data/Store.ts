import { Atom, WritableAtom } from 'jotai';

type Getter = {
  <Value>(atom: Atom<Value | Promise<Value>>): Value,
  <Value>(atom: Atom<Promise<Value>>): Value,
  <Value>(atom: Atom<Value>): Awaited<Value>,
};

type WriteGetter = Getter & {
  <Value>(
    atom: Atom<Value | Promise<Value>>,
    options: {
      unstable_promise: true,
    }
  ): Promise<Value> | Value,
  <Value>(
    atom: Atom<Promise<Value>>,
    options: {
      unstable_promise: true,
    }
  ): Promise<Value> | Value,
  <Value>(
    atom: Atom<Value>,
    options: {
      unstable_promise: true,
    }
  ): Promise<Awaited<Value>> | Awaited<Value>,
};

type SetValue<T> = T | ((prev: T) => T);

type Setter<T = any> = {
  <Value, Result extends void | Promise<void>>(
    atom: WritableAtom<Value, undefined, Result>
  ): Result,
  <Value, Update extends SetValue<T>, Result extends void | Promise<void>>(
    atom: WritableAtom<Value, Update, Result>,
    update: Update
  ): Result,
};

// Store/SDK implementation
const STORE_GET = Symbol('store.get');
const STORE_SET = Symbol('store.set');

export class Store {
  // private members
  private [STORE_GET]: WriteGetter | null = null;
  private [STORE_SET]: Setter | null = null;

  // public members
  initialized = false;

  constructor() {
    console.log('Before initialized', this.initialized);
  }

  init(get: WriteGetter, set: Setter) {
    this[STORE_GET] = get;
    this[STORE_SET] = set;
    this.initialized = true;
    console.log('After initialized', this.initialized, this);
  }

  set<T>(atom: WritableAtom<T, any, any>, update: SetValue<T>) {
    const setter = this[STORE_SET];

    if (!setter) return;

    setter(atom, update);
  }

  patch<T>(atom: WritableAtom<T, any, any>, patch: Partial<T>) {
    this.set(atom, (state: T) => ({ ...state, ...patch }));
  }

  get<T>(atom: Atom<T>) {
    const getter = this[STORE_GET];

    if (!getter) return;

    return getter(atom);
  }
}
