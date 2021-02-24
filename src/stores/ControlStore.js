import { types } from "mobx-state-tree";

/**
 * Control store of Label Studio
 */
const ControlStore = types
  .model("ControlStore", {
    /**
     * Name of control
     */
    name: types.identifier,
    /**
     * Description (tooltips on hover)
     */
    description: types.string,
    /**
     * Hotkey
     */
    hotkey: types.optional(types.string, ""),
    /**
     * Render order
     */
    priority: types.optional(types.number, 1),
    /**
     * Whether it should be rendered or not
     */
    display: types.optional(types.boolean, true),
    /**
     * Icon
     */
    icon: types.optional(types.string, ""),
    /**
     * Type
     */
    type: types.optional(types.string, "primary"),
    /**
     * Whether it triggers the isSubmitting status when clicked
     */
    async: types.optional(types.boolean, false),
    /**
     * Callback
     */
    emits: types.string,
    /**
     * Custom CSS classes for the button
     */
    classes: types.optional(types.string, ""),
  })
  .views(self => ({
    get displayName() {
      return self.name;
    },
  }));

export default ControlStore;
