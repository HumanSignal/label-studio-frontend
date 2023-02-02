import { Atom, Getter, Setter, WritableAtom } from 'jotai';
import { isDefined } from 'src/utils/utilities';

export type SetAtom<
  Update,
  Result extends void | Promise<void>
> = undefined extends Update
  ? (update?: Update) => Result
  : (update: Update) => Result;

type InputValue<AtomType> = AtomType extends WritableAtom<any, infer Input> ? Input : never;

let atomSet: Setter;
let atomGet: Getter;

/**
 * Store gives external world access to the atoms inside the app
 * It is initialized once at the very beginning of the app initialization
 * It is used by the SDK to access the atoms both internally and externally
 * See more in:
 *  - src/code/SDK/Internal/Internal.sdk.ts
 *  - src/code/SDK/External/External.sdk.ts
 */
export class Store {

  get initialized() {
    return isDefined(atomGet) && isDefined(atomSet);
  }

  static init(get: Getter, set: Setter) {
    atomGet = get;
    atomSet = set;
  }

  get<T>(atom: Atom<T>) {
    return atomGet(atom);
  }

  set<
    Value,
    Update,
    Result extends void | Promise<void>,
  >(
    atom: WritableAtom<Value, Update, Result>,
    update: Update,
  ) {
    atomSet(atom, update);
  }

  patch<
    AtomValue extends WritableAtom<any, any>,
    Update extends InputValue<AtomValue>,
  >(atom: AtomValue, patch: Partial<Update>) {
    this.set(atom, (state: Update) => ({ ...state, ...patch }));
  }
}
