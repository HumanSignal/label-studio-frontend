import { types } from "mobx-state-tree";
import Types from "../../core/Types";
import { SharedStoreModel } from "./model";

const StoreIds = new Set();
const Stores = new Map();

export const SharedStoreMixin = types.model("SharedStoreMixin", {
  sharedstore: types.optional(types.maybeNull(types.string), null),
  store: types.optional(types.maybeNull(types.reference(SharedStoreModel)), null),
})
  .views((self) => ({
    get children() {
      return self.sharedChildren;
    },

    get locked() {
      return self.store?.locked ?? false;
    },

    set children(val) {
      self.store?.lock();
      self.store.setChildren(val);
    },

    get sharedChildren() {
      return self.store.children ?? [];
    },

    get storeId() {
      return self.sharedstore ?? self.name;
    },
  }))
  .actions(self => ({
    afterCreate() {
      if (!self.store) {
        const store = Stores.get(self.storeId);
        const annotationStore = Types.getParentOfTypeString(self, "AnnotationStore");

        annotationStore.addSharedStore(store);
        StoreIds.add(self.storeId);
        self.store = self.storeId;
      }
    },
  }))
  .preProcessSnapshot((sn) => {
    const storeId = sn.sharedstore ?? sn.name;

    if (StoreIds.has(storeId)) {
      sn.store = storeId;
    } else {
      Stores.set(storeId, SharedStoreModel.create({
        id: storeId,
        children: sn._children ?? sn.children ?? [],
      }));
    }

    return sn;
  });


