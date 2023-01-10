import { decode, encode } from '@thi.ng/rle-pack';
import chroma from 'chroma-js';
import Constants from '../core/Constants';

import * as Colors from './colors';

// given the imageData object returns the DOM Image with loaded data
function imageData2Image(imagedata: ImageData) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);

  const image = new Image();

  image.src = canvas.toDataURL();
  return image;
}

// given the RLE array returns the DOM Image element with loaded image
function RLE2Region(
  rle: Uint8Array,
  image: HTMLImageElement, {
    color = Constants.FILL_COLOR,
  } = {},
) {
  const nw = image.naturalWidth,
    nh = image.naturalHeight;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = nw;
  canvas.height = nh;

  const newdata = ctx.createImageData(nw, nh);

  newdata.data.set(decode(rle));
  const rgb = chroma(color).rgb();

  for (let i = newdata.data.length / 4; i--; ) {
    if (newdata.data[i * 4 + 3]) {
      newdata.data[i * 4] = rgb[0];
      newdata.data[i * 4 + 1] = rgb[1];
      newdata.data[i * 4 + 2] = rgb[2];
    }
  }
  ctx.putImageData(newdata, 0, 0);

  const new_image = new Image();

  new_image.src = canvas.toDataURL();
  return new_image;
}

// given the brush region return the RLE encoded array
function Region2RLE(region: any, image: HTMLImageElement) {
  const nw = image.naturalWidth,
    nh = image.naturalHeight;
  const stage = region.object?.stageRef;
  const parent = region.parent;

  if (!stage) {
    console.error(`Stage not found for area #${region.cleanId}`);
    return;
  }

  const layer = stage.findOne(`#${region.cleanId}`);
  const isVisible = layer.visible();

  if (!layer) {
    console.error(`Layer #${region.id} was not found on Stage`);
    return [];
  }
  !isVisible && layer.show();
  // hide labels on regions and show them later
  layer.findOne('.highlight').hide();

  const width = stage.getWidth(),
    height = stage.getHeight(),
    scaleX = stage.getScaleX(),
    scaleY = stage.getScaleY(),
    x = stage.getX(),
    y = stage.getY(),
    offsetX = stage.getOffsetX(),
    offsetY = stage.getOffsetY(),
    rotation = stage.getRotation();

  stage
    .setWidth(parent.stageWidth)
    .setHeight(parent.stageHeight)
    .setScaleX(1)
    .setScaleY(1)
    .setX(0)
    .setY(0)
    .setOffsetX(0)
    .setOffsetY(0)
    .setRotation(0);
  stage.drawScene();
  // resize to original size
  const canvas = layer.toCanvas({ pixelRatio: nw / image.stageWidth });
  const ctx = canvas.getContext('2d');

  // get the resulting raw data and encode into RLE format
  const data = ctx.getImageData(0, 0, nw, nh);

  for (let i = data.data.length / 4; i--; ) {
    data.data[i * 4] = data.data[i * 4 + 1] = data.data[i * 4 + 2] = data.data[i * 4 + 3];
  }
  layer.findOne('.highlight').show();
  stage
    .setWidth(width)
    .setHeight(height)
    .setScaleX(scaleX)
    .setScaleY(scaleY)
    .setX(x)
    .setY(y)
    .setOffsetX(offsetX)
    .setOffsetY(offsetY)
    .setRotation(rotation);
  stage.drawScene();
  const rle = encode(data.data, data.data.length);

  !isVisible && layer.hide();

  return rle;
}

function brushSizeCircle(size: number) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = size * 4 + 8;
  canvas.height = size * 4 + 8;

  ctx.beginPath();
  ctx.arc(size / 2 + 4, size / 2 + 4, size / 2, 0, 2 * Math.PI, false);

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'white';
  ctx.stroke();

  return canvas.toDataURL();
}

function encodeSVG(data: string) {
  const externalQuotesValue: 'single' | 'double' = 'single';

  function getQuotes() {
    const double = '"';
    const single = '\'';

    return {
      level1: externalQuotesValue === 'double' ? double : single,
      level2: externalQuotesValue === 'double' ? single : double,
    };
  }

  const quotes = getQuotes();

  function addNameSpace(data: string) {
    if (data.indexOf('http://www.w3.org/2000/svg') < 0) {
      data = data.replace(/<svg/g, `<svg xmlns=${quotes.level2}http://www.w3.org/2000/svg${quotes.level2}`);
    }

    return data;
  }

  data = addNameSpace(data);
  const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;

  // Use single quotes instead of double to avoid encoding.
  if (externalQuotesValue === 'double') {
    data = data.replace(/"/g, '\'');
  } else {
    data = data.replace(/'/g, '"');
  }

  data = data.replace(/>\s{1,}</g, '><');
  data = data.replace(/\s{2,}/g, ' ');

  // var resultCss = `background-image: url();`;

  const escaped = data.replace(symbols, encodeURIComponent);

  return `${quotes.level1}data:image/svg+xml,${escaped}${quotes.level1}`;
}

const labelToSVG = (function() {
  const SVG_CACHE: Record<string, string> = {};

  function calculateTextWidth(text: string) {
    const svg = document.createElement('svg');
    const svgText = document.createElement('text');

    svgText.setAttribute('style', 'font-size: 9.5px; font-weight: bold; color: red; fill: red; font-family: Monaco');
    svgText.innerHTML = text;

    svg.appendChild(svgText);
    document.body.appendChild(svg);

    const textLen = svgText.getBoundingClientRect().width;

    svg.remove();

    return textLen;
  }

  return function({
    label,
    score,
  }: {
    label: string,
    score: number | null,
  }) {
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

    const res = `<svg height="16" width="${width}">${items.join('')}</svg>`;
    const enc = encodeSVG(res);

    SVG_CACHE[cacheKey] = enc;
    return enc;
  };
})();

/**
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {{
 * canvas: HTMLCanvasElement,
 * bbox: {
 *   left: number,
 *   top: number,
 *   right: number,
 *   bottom: number,
 *   width: number,
 *   height: number
 * }
 * }}
 */

type TrimBBox = {
  top: number | null,
  left: number | null,
  right: number | null,
  bottom: number | null,
}

const trim = (canvas: HTMLCanvasElement) => {
  let copy, width = canvas.width, height = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const bbox: TrimBBox = {
    top: null,
    left: null,
    right: null,
    bottom: null,
  };

  try {
    copy = document.createElement('canvas').getContext('2d')!;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const l = pixels.data.length;
    let i, x, y;

    for (i = 0; i < l; i += 4) {
      if (pixels.data[i+3] !== 0) {
        x = (i / 4) % canvas.width;
        y = ~ ~ ((i / 4) / canvas.width);

        if (bbox.top === null) {
          bbox.top = y;
        }

        if (bbox.left === null) {
          bbox.left = x;
        } else if (x < bbox.left) {
          bbox.left = x;
        }

        if (bbox.right === null) {
          bbox.right = x;
        } else if (bbox.right < x) {
          bbox.right = x;
        }

        if (bbox.bottom === null) {
          bbox.bottom = y;
        } else if (bbox.bottom < y) {
          bbox.bottom = y;
        }
      }
    }

    width = bbox.right! - bbox.left!;
    height = bbox.bottom! - bbox.top!;
    const trimmed = ctx.getImageData(bbox.left!, bbox.top!, width, height);

    copy.canvas.width = width;
    copy.canvas.height = height;
    copy.putImageData(trimmed, 0, 0);
  } catch (err) {
    /* Gotcha! */
  }

  // open new window with trimmed image:
  return {
    canvas: copy?.canvas ?? canvas,
    bbox: {
      ...bbox,
      width,
      height,
    },
  };
};

export default {
  imageData2Image,
  Region2RLE,
  RLE2Region,
  brushSizeCircle,
  labelToSVG,
  trim,
};
