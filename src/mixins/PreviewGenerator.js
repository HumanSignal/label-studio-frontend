import { types } from "mobx-state-tree";
import { ImageGen } from "../utils/image_gen";

const _generatePreview = (background, layers) => {
  const generator = new ImageGen({
    background,
    layers,
    variants: [
      [60, 60],
      [120, 120],
      [200, 100],
      [100, 200],
    ],
  });

  return generator.generate();
};

export const PreviewGenerator = types.model("PreviewGenerator").views(self => ({
  generatePreview() {
    switch (self.type) {
      default:
        return undefined;
      case "image":
        return _generatePreview(self.imageRef, Array.from(self.stageRef?.content?.querySelectorAll("canvas") ?? []));
    }
  },
}));
