import { types } from "mobx-state-tree";
import { ImageGen } from "../utils/image_gen";
import { svgConcat } from "../utils/svg_utils";

const _generatePreview = (background, options = {}) => {
  const generator = new ImageGen({
    background,
    layers: options?.layers ?? [],
    size: options?.size ?? {
      width: 500,
      height: 500,
    },
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
        return _generatePreview(self.imageRef, {
          layers: Array.from(self.stageRef?.content?.querySelectorAll("canvas") ?? []),
        });
      case "timeseries":
        const svg = await svgConcat(...self._nodeReference.querySelectorAll("svg"));
        console.log(svg, self._nodeReference.querySelectorAll("svg"));
        return _generatePreview(svg, {
          size: { width: svg.width, height: svg.height },
        });
      case "audioplus":
        const root = self._ws.container;
        const zoom = root.clientWidth / root.scrollWidth;
        const regions = root.querySelectorAll("region");
        const canvases = root.querySelectorAll("canvas");

        const layers = [self.audioRegionsToLayer(root, regions, zoom)];
        const background = this.concatCanvases(root, Array.from(canvases), zoom, "horizontal");

        return _generatePreview(background, {
          layers,
          size: { width: background.width, height: background.height },
        });
    }
  },

  audioRegionsToLayer(root, regions, zoom) {
    const canvas = document.createElement("canvas");
    canvas.width = root.clientWidth;
    canvas.height = root.clientHeight;

    const context = canvas.getContext("2d");

    regions.forEach(region => {
      const offset = region.offsetLeft * zoom;
      const width = region.clientWidth * zoom;
      const height = region.clientHeight;
      const color = region.style.backgroundColor;

      context.fillStyle = color;
      context.strokeStyle = "#000";
      context.lineWidth = 3;
      context.fillRect(offset, 0, width, height);

      context.moveTo(offset, 0);
      context.lineTo(offset, height);

      context.moveTo(offset + width, 0);
      context.lineTo(offset + width, height);
      context.stroke();
    });

    return canvas;
  },

  concatCanvases(root, canvases, zoom, direction) {
    const canvas = document.createElement("canvas");
    canvas.width = root.clientWidth;
    canvas.height = root.clientHeight;

    let offset = 0;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    canvases.forEach(c => {
      const [width, height] = [c.width * zoom, c.height * zoom];

      context.drawImage(
        c,
        0,
        0,
        c.width,
        c.height,
        direction === "vertical" ? 0 : offset,
        direction === "horizontal" ? 0 : offset,
        width,
        height,
      );

      offset += direction === "vertical" ? height : width;
    });

    return canvas;
  },
}));
