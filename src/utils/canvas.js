import Konva from "konva";
import { encode, decode } from "@thi.ng/rle-pack";

import * as Colors from "./colors";

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

  ctx.beginPath();
  ctx.arc(size / 2 + 4, size / 2 + 4, size / 2, 0, 2 * Math.PI, false);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.stroke();

  return canvas.toDataURL();
}

function encodeSVG(data) {
  var externalQuotesValue = "single";

  function getQuotes() {
    const double = `"`;
    const single = `'`;

    return {
      level1: externalQuotesValue === "double" ? double : single,
      level2: externalQuotesValue === "double" ? single : double,
    };
  }

  var quotes = getQuotes();

  function addNameSpace(data) {
    if (data.indexOf("http://www.w3.org/2000/svg") < 0) {
      data = data.replace(/<svg/g, `<svg xmlns=${quotes.level2}http://www.w3.org/2000/svg${quotes.level2}`);
    }

    return data;
  }

  data = addNameSpace(data);
  var symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;

  // Use single quotes instead of double to avoid encoding.
  if (externalQuotesValue === "double") {
    data = data.replace(/"/g, "'");
  } else {
    data = data.replace(/'/g, '"');
  }

  data = data.replace(/>\s{1,}</g, "><");
  data = data.replace(/\s{2,}/g, " ");

  // var resultCss = `background-image: url();`;

  var escaped = data.replace(symbols, encodeURIComponent);
  return `${quotes.level1}data:image/svg+xml,${escaped}${quotes.level1}`;
}

const labelToSVG = (function() {
  const SVG_CACHE = {};

  function calculateTextWidth(text) {
    const svg = document.createElement("svg");
    const svgText = document.createElement("text");
    svgText.style = "font-size: 9.5px; font-weight: bold; color: red; fill: red; font-family: Monaco";
    svgText.innerHTML = text;

    svg.appendChild(svgText);
    document.body.appendChild(svg);

    const textLen = svg.getBoundingClientRect().width;
    svg.remove();

    return textLen;
  }

  return function({ label, score }) {
    let cacheKey = label;
    if (score !== null) cacheKey = cacheKey + score;

    if (cacheKey in SVG_CACHE) return SVG_CACHE[cacheKey];

    let width = 0;
    const items = [];

    if (score !== null && score !== undefined) {
      const fillColor = Colors.getScaleGradient(score);
      items.push(`<rect x="0" y="0" rx="2" ry="2" width="24" height="14" style="fill:${fillColor};opacity:0.5" />`);
      items.push(`<text x="3" y="10" style="font-size: 8px; font-family: Monaco">${score.toFixed(2)}</text>`);
      width = width + 26;
    }

    if (label) {
      items.push(
        `<text x="${width}" y="11" style="font-size: 9.5px; font-weight: bold; font-family: Monaco">${label}</text>`,
      );
      width = width + calculateTextWidth(label) + 2;
    }

    const res = `<svg height="16" width="${width}">${items.join("")}</svg>`;
    const enc = encodeSVG(res);

    SVG_CACHE[cacheKey] = enc;
    return enc;
  };
})();

export default {
  imageData2Image,
  Region2RLE,
  RLE2Region,
  brushSizeCircle,
  labelToSVG,
};
