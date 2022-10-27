import { detach, types } from "mobx-state-tree";
import Types from "../core/Types";

const SharedStore = {};

const SharedStoreModel = (childrenType) => types.model({
  children: Types.unionArray(childrenType),
})
  .actions((self) => ({
    setChildren(val) {
      self.children = val;
    },
    clear() {
      self.children = [];
    },
    destroy() {
      self.clear();
      detach(self);
      self.die();
    },
  }));

export const SharedStoreMixin = (childrenType) => types.model("SharedStore", {
  sharedstore: types.optional(types.maybeNull(types.string), null),
})
  .views((self) => ({
    get children() {
      return self.sharedChildren;
    },

    set children(val) {
      self.sharedStoreModel.setChildren(val);
    },

    get sharedStoreModel() {
      return SharedStore[self.storeId];
    },

    get sharedChildren() {
      return self.sharedStoreModel?.children ?? [];
    },

    get storeId() {
      return self.sharedstore ?? self.name;
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      if (self.sharedstore) {
        self.sharedStoreModel.destroy();
        delete SharedStore[self.sharedstore];
      }
    },
  }))
  .preProcessSnapshot((sn) => {
    const storeId = sn.sharedstore ?? sn.name;

    if (storeId && !SharedStore[storeId]) {
      SharedStore[storeId] = SharedStoreModel(childrenType ?? []).create({ children: sn.children });
    }

    return sn;
  });
