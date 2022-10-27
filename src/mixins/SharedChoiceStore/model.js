import { detach, types } from "mobx-state-tree";
import Types from "../../core/Types";

export const SharedStoreModel = types.model("SharedStoreModel", {
  id: types.identifier,
  locked: false,
  children: Types.unionArray(["choice"]),
})
  .actions((self) => ({
    setChildren(val) {
      self.children = val;
    },
    clear() {
      self.children = [];
    },
    lock() {
      self.locked = true;
    },
    unlock() {
      self.locked = false;
    },
    destroy() {
      self.clear();
      detach(self);
      self.die();
    },
  }));
