import { types } from "mobx-state-tree";

export const EditableRegion = types
  .model("EditableRegion")
  .volatile(() => ({
    editorEnabled: true,
  }))
  .views((self) => ({
    getProperty(name) {
      return self[name];
    },
  }))
  .actions((self) => ({
    setProperty(propName, value) {
      self[propName] = value;
    },
  }));
