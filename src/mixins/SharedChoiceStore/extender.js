import { detach, types } from "mobx-state-tree";
import { SharedStoreModel } from "./model";

export const StoreExtender = types.model("StoreExtender", {
  sharedStores: types.optional(types.map(SharedStoreModel), {}),
}).actions((self) => ({
  addSharedStore(store) {
    self.sharedStores.set(store.id, store);
  },
  beforeDestroy() {
    self.sharedStores.forEach((store) => {
      detach(store);
      store.die();
    });
  },
}));
