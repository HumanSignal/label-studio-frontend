import { Store } from './Store';

type ValuesOf<T> = T extends Record<string, infer V> ? V : never;

export class AtomicStore<
  T extends Record<string, any>,
  Properties extends keyof T,
  Value extends ValuesOf<T>
> extends Store {
  private store: Map<string, Value> = new Map();
  private structure: T;

  constructor(structure: T) {
    super();

    this.structure = structure;
  }

  read(property: Properties) {
    return this.store.get(this.structure[property]);
  }

  write(property: Properties, value: any) {
    this.store.set(this.structure[property], value);
  }
}

// const as = new AtomicStore({
//   hello: atom<string>('hello'),
//   world: atom<string>('world'),
// });

// const hello = as.read('hello');


