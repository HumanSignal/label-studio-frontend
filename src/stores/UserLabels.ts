import { types } from "mobx-state-tree";

// interface ControlsWithLabels extends Map<string, string[][]> {}
type ControlsWithLabels = Record<string, string[][]>;

// Subset of user generated labels per control tag, currently only for taxonomy
const UserLabels = types
  .model({
    // controls: types.map(types.array(types.array(types.string))),
    controls: types.frozen<ControlsWithLabels>({}),
  })
  .actions(self => ({
    addLabel(control: string, label: string[]) {
      const labels = [...(self.controls[control] ?? []), label];

      self.controls = { ...self.controls, [control]: labels };
    },

    init(controls: ControlsWithLabels) {
      self.controls = controls;
    },
  }));

export { UserLabels };
