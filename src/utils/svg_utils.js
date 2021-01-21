export const svgToCanvas = svg => {
  const canvas = document.createElement("canvas");

  canvas.width = svg.clientWidth;
  canvas.height = svg.clientHeight;

  return new Promise(resolve => {
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const serializer = new XMLSerializer();
    const blob = new Blob([serializer.serializeToString(svg)], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const image = new Image();

    image.onload = () => {
      console.log("Image loaded");
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    image.src = url;
    image.width = canvas.width;
    image.height = canvas.height;
  });
};

export const svgConcat = async (...svg) => {
  const width = Math.max(...svg.map(s => s.clientWidth));
  const height = svg.reduce((w, s) => w + s.clientHeight, 0);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  let offset = 0;

  const converted = await Promise.all(svg.map(svgToCanvas));

  converted.forEach(s => {
    context.drawImage(s, 0, offset);

    offset += s.height;
  });

  return canvas;
};
