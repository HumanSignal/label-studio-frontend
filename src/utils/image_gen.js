export class ImageGen {
  constructor(options) {
    this.variants = options.variants ?? [];
    this.layers = options.layers ?? [];
    this.size = options.size;
    this.background = options.background;

    console.assert(!!this.background, "Background not provided.");
  }

  generate() {
    const result = {};

    const original = this.createImage();

    result.original = original.canvas.toDataURL();

    this.variants.forEach(([width, height]) => {
      result[`${width}x${height}`] = this.createVariant(original, width, height);
    });

    return result;
  }

  createImage() {
    const bottomLayer = this.background;
    const width = this.size?.width ?? this.implyWidth(bottomLayer);
    const height = this.size?.height ?? this.implyHeight(bottomLayer);

    const resultCanvas = this.createCanvas(width, height);
    const canvasContext = resultCanvas.getContext("2d");

    this.bakeLayers(canvasContext, [bottomLayer, ...this.layers]);

    return canvasContext;
  }

  /**
   *
   * @param {CanvasRenderingContext2D} source Source image
   * @param {Number} width Variant target width
   * @param {Number} height Variant target height
   */
  createVariant(source, width, height) {
    const resultCanvas = this.createCanvas(width, height);
    const canvasContext = resultCanvas.getContext("2d");

    const { canvas: sourceCanvas } = source;
    const { width: cWidth, height: cHeight } = sourceCanvas;

    const wRatio = width / cWidth;
    const hRatio = height / cHeight;
    const ratio = Math.min(wRatio, hRatio);

    const xOffset = (width - cWidth * ratio) / 2;
    const yOffset = (height - cHeight * ratio) / 2;

    canvasContext.drawImage(
      source?.canvas ?? source,
      0,
      0,
      cWidth,
      cHeight,
      xOffset,
      yOffset,
      cWidth * ratio,
      cHeight * ratio,
    );

    return resultCanvas.toDataURL();
  }

  /**
   * @param {CanvasRenderingContext2D} canvasContext
   * @param {(Image|ImageData|HTMLCanvasElement)[]} layers
   */
  bakeLayers(canvasContext, layers) {
    const { width, height } = canvasContext.canvas;
    layers.forEach(layer => {
      try {
        const drawable = layer?.canvas ?? layer;
        const drawableWidth = drawable.naturalWidth ?? drawable.width;
        const drawableHeight = drawable.naturalHeight ?? drawable.height;
        canvasContext.drawImage(drawable, 0, 0, drawableWidth, drawableHeight, 0, 0, width, height);
      } catch (err) {
        console.log(err, layer);
      }
    });
  }

  /**
   * @param {HTMLImageElement?} image
   */
  implyWidth(image) {
    return image?.naturalWidth ?? 500;
  }

  /**
   * @param {HTMLImageElement?} image
   */
  implyHeight(image) {
    return image?.naturalHeight ?? 500;
  }

  createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.setProperty("width", `${width}px`);
    canvas.style.setProperty("height", `${height}px`);
    return canvas;
  }
}

export const generatePages = previews => {
  console.log(previews);

  const previewsHTML = Object.entries(previews)
    .map(([key, value]) => {
      return `
      <div class="value-wrapper" data-name="${key}">
        ${Object.entries(value)
          .map(([size, image]) => {
            return `<div class="image-wrapper" data-size="${size}"><div class="image-background"><img src="${image}"/></div></div>`;
          })
          .join("\n")}
      </div>
    `;
    })
    .join("\n");

  const pageHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Images preview</title>
      <style>
        .value-wrapper {
          display: flex;
          width: 100vw;
          overflow: auto;
        }
        .image-wrapper {
          width: 300px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #efefef;
        }
        .image-wrapper::before {
          top: 5px;
          left: 5px;
          padding: 3px;
          font-size: 11px;
          color: #fff;
          background: #000;
          position: absolute;
          content: attr(data-size);
        }
        .image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }
        .image-background {
          display: inline-block;
          background: #ccc;
          max-width: 100%;
          max-height: 100%;
        }
      </style>
    </head>
    <body>
      ${previewsHTML}
    </body>
    </html>
  `;

  const blob = new Blob([pageHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  return url.toString();
};
