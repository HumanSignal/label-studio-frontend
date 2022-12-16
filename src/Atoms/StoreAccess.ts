import { Store } from './Store';

export class StoreAccess {
  store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  hydrate(data: any): void {
    throw new Error('Method not implemented.' + data);
  }
}
