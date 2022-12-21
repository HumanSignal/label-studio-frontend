import { Atom, Getter, Setter, WritableAtom } from 'jotai';

export type SetAtom<
  Update,
  Result extends void | Promise<void>
> = undefined extends Update
  ? (update?: Update) => Result
  : (update: Update) => Result;

// Store/SDK implementation
const STORE_GET = Symbol('store.get');
const STORE_SET = Symbol('store.set');

type InputValue<AtomType> = AtomType extends WritableAtom<any, infer Input> ? Input : never;

/**
 * Store gives external world access to the atoms inside the app
 * It is initialized once at the very beginning of the app initialization
 * It is used by the SDK to access the atoms both internally and externally
 * See more in:
 *  - src/code/SDK/Internal/Internal.sdk.ts
 *  - src/code/SDK/External/External.sdk.ts
 */
export class Store {
  // private members
  private [STORE_GET]: Getter | null = null;
  private [STORE_SET]: Setter | null = null;

  // public members
  initialized = false;

  constructor() {
    console.log('Before initialized', this.initialized);
  }

  init(get: Getter, set: Setter) {
    this[STORE_GET] = get;
    this[STORE_SET] = set;
    this.initialized = true;
    console.log('After initialized', this.initialized, this);
  }

  set<
    Value,
    Update,
    Result extends void | Promise<void>,
  >(
    atom: WritableAtom<Value, Update, Result>,
    update: Update,
  ) {
    const setter = this[STORE_SET];

    if (!setter) return;

    setter(atom, update);
  }

  patch<
    AtomValue extends WritableAtom<any, any>,
    Update extends InputValue<AtomValue>,
  >(atom: AtomValue, patch: Partial<Update>) {
    this.set(atom, (state: Update) => ({ ...state, ...patch }));
  }

  get<T>(atom: Atom<T>) {
    const getter = this[STORE_GET];

    if (!getter) return;

    return getter(atom);
  }
}
