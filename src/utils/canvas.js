import Konva from "konva";
import { encode, decode } from "@thi.ng/rle-pack";

// given the imageData object returns the DOM Image with loaded data
function imageData2Image(imagedata) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);

  var image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

// given the RLE array returns the DOM Image element with loaded image
function RLE2Region(rle, image) {
  const nw = image.naturalWidth,
    nh = image.naturalHeight;

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = nw;
  canvas.height = nh;

  const newdata = ctx.createImageData(nw, nh);
  newdata.data.set(decode(rle));

  ctx.putImageData(newdata, 0, 0);

  var new_image = new Image();
  new_image.src = canvas.toDataURL();
  return new_image;
}

// given the brush region return the RLE encoded array
function Region2RLE(region, image, lineOpts) {
  const nw = image.naturalWidth,
    nh = image.naturalHeight;

  var cnt = document.createElement("div");
  cnt.style.display = "none";

  document.body.appendChild(cnt);

  cnt.id = "container-2";

  const stage = new Konva.Stage({
    container: "container-2",
    width: nw,
    height: nh,
  });

  const layer = new Konva.Layer();
  const ctx = layer.getContext("2d");

  // draw the original RLE first
  if (region._img) ctx.drawImage(region._img, 0, 0);

  // draw all the modifications
  const lines = region.touches.map(p => {
    const points = p.rescale(image.stageWidth, image.stageHeight, image.naturalWidth, image.naturalHeight);

    const compOp = p.type === "add" ? "source-over" : "destination-out";

    const l = {
      points: points,
      strokeWidth: p.scaledStrokeWidth(image.stageWidth, image.stageHeight, image.naturalWidth, image.naturalHeight),
      globalCompositeOperation: compOp,
      lineJoin: "round",
      lineCap: "round",
      opacity: 1,
      ...lineOpts,

      // stroke: 'red',
      // strokeWidth: 15,
      // lineCap: 'round',
      // lineJoin: 'round'
    };

    // console.log(l);

    return new Konva.Line(l);
  });

  lines.forEach(line => layer.add(line));

  // add the layer to the stage
  stage.add(layer);

  // get the resulting raw data and encode into RLE format
  const data = ctx.getImageData(0, 0, nw, nh);
  const rle = encode(data.data, data.data.length);

  return rle;
}

function brushSizeCircle(size) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = size * 4 + 8;
  canvas.height = size * 4 + 8;

  // ctx.beginPath();
  // ctx.rect(0, 0, size, size);
  // ctx.lineWidth = "6";
  // ctx.strokeStyle = "red";
  // ctx.stroke();

  ctx.beginPath();

  //    ctx.arc(size / 2, size / 2, size, 0, 2 * Math.PI);

  ctx.arc(size / 2 + 4, size / 2 + 4, size / 2, 0, 2 * Math.PI, false);
  // ctx.fillStyle = '';
  // ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  // ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.stroke();

  // ctx.beginPath();
  // ctx.arc(0, 0, size, 0, Math.PI * 2, true); // Outer circle
  // ctx.stroke();

  // ctx.putImageData(imagedata, 0, 0);
  return canvas.toDataURL();

  // var image = new Image();
  // image.src = canvas.toDataURL();
  // return image;
}

export default {
  imageData2Image,
  Region2RLE,
  RLE2Region,
  brushSizeCircle,
};
