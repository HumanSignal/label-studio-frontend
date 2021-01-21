import { types } from "mobx-state-tree";
import { ImageGen } from "../utils/image_gen";
import { svgConcat } from "../utils/svg_utils";

const _generatePreview = (background, layers = []) => {
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
  async generatePreview() {
    switch (self.type) {
      default:
        return undefined;
      case "image":
        return _generatePreview(self.imageRef, Array.from(self.stageRef?.content?.querySelectorAll("canvas") ?? []));
      case "timeseries":
        const svg = await svgConcat(...self._nodeReference.querySelectorAll("svg"));
        console.log(svg, self._nodeReference.querySelectorAll("svg"));
        return _generatePreview(svg);
    }
  },
}));
