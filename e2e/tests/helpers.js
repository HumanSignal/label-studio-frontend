/* eslint-disable no-undef */

/**
 * Load custom example
 * @param {object} params
 * @param {string} params.config
 * @param {object} params.data object with property used in config
 * @param {object[]} params.annotations
 * @param {object[]} params.predictions
 * @param {function} done
 */
const initLabelStudio = async ({
  config,
  data,
  annotations = [{ result: [] }],
  predictions = [],
  settings = {},
  additionalInterfaces = [],
  params = {},
},  done) => {
  if (window.Konva && window.Konva.stages.length) window.Konva.stages.forEach(stage => stage.destroy());

  const interfaces = [
    "panel",
    "update",
    "submit",
    "controls",
    "side-column",
    "topbar",
    "annotations:history",
    "annotations:current",
    "annotations:tabs",
    "annotations:menu",
    "annotations:add-new",
    "annotations:delete",
    "predictions:tabs",
    "predictions:menu",
    "edit-history",
    ...additionalInterfaces,
  ];
  const task = { data, annotations, predictions };

  window.LabelStudio.destroyAll();
  window.labelStudio = new window.LabelStudio("label-studio", { interfaces, config, task, settings, ...params });
  done();
};

const createAddEventListenerScript = (eventName, callback) => {
  const args = (new Array(callback.length)).fill().map((v, idx) => {
    return `v${idx}`;
  }).join(", ");

  return new Function("done", `
    function ${eventName}(${args}) {
      return (${callback.toString()})(${args});
    }
    window.labelStudio.on("${eventName}",${eventName});
    done();
  `);
};

const setFeatureFlags = (featureFlags, done) => {
  if (!window.APP_SETTINGS) window.APP_SETTINGS = {};
  if (!window.APP_SETTINGS.feature_flags) window.APP_SETTINGS.feature_flags = {};
  window.APP_SETTINGS.feature_flags = {
    ...window.APP_SETTINGS.feature_flags,
    ...featureFlags,
  };
  done();
};

/**
 * Wait for the main Image object to be loaded
 * @param {function} done codecept async success handler
 */
const waitForImage = async done => {
  const img = document.querySelector("[alt=LS]");

  if (!img || img.complete) return done();
  // this should be rewritten to isReady when it is ready
  img.onload = ()=>{
    setTimeout(done, 100);
  };
};

/**
 * Wait for all audio on the page to be loaded
 * @param {function} done codecept async success handler
 */
const waitForAudio = async done => {
  const audios = document.querySelectorAll("audio");

  await Promise.all(
    [...audios].map(audio => {
      if (audio.readyState === 4) return true;
      return new Promise(resolve => {
        audio.addEventListener("durationchange", () => {
          resolve(true);
        });
      });
    }),
  );
  done();
};

/**
 * Float numbers can't be compared strictly, so convert any numbers or structures with numbers
 * to same structures but with rounded numbers (int for ints, fixed(2) for floats)
 * @param {*} data
 */
const convertToFixed = (data, fractionDigits = 2) => {
  if (["string", "number"].includes(typeof data)) {
    const n = Number(data);

    return Number.isNaN(n) ? data : Number.isInteger(n) ? n : +Number(n).toFixed(fractionDigits);
  }
  if (Array.isArray(data)) {
    return data.map(n => convertToFixed(n, fractionDigits));
  }
  if (typeof data === "object") {
    const result = {};

    for (const key in data) {
      result[key] = convertToFixed(data[key], fractionDigits);
    }
    return result;
  }
  return data;
};

/**
 * Create convertor for any measures to relative form on image with given dimensions
 * Accepts numbers, arrays ([x, y] treated as a special coords array) and hash objects
 * With [706, 882] given as image sizes:
 *   assert.equal(convertToImageSize(123), 17.42);
 *   assert.deepEqual(convertToImageSize([123, 123]), [17.42, 13.95]);
 *   assert.deepEqual(
 *     convertToImageSize({ width: 123, height: 123, radiusY: 123, coords: [123, 123] }),
 *     { width: 17.42, height: 13.95, radiusY: 13.95, coords: [17.42, 13.95] }
 *   );
 * @param {number} width
 * @param {number} height
 */
const getSizeConvertor = (width, height) =>
  function convert(data, size = width) {
    if (typeof data === "number") return convertToFixed((data * 100) / size);
    if (Array.isArray(data)) {
      if (data.length === 2) return [convert(data[0]), convert(data[1], height)];
      return data.map(n => convert(n));
    }
    if (typeof data === "object") {
      const result = {};

      for (const key in data) {
        if (key === "rotation") result[key] = data[key];
        else if (key.startsWith("height") || key === "y" || key.endsWith("Y")) result[key] = convert(data[key], height);
        else result[key] = convert(data[key]);
      }
      return result;
    }
    return data;
  };

const delay = n => new Promise(resolve => setTimeout(resolve, n));

// good idea, but it doesn't work :(
const emulateClick = source => {
  const event = document.createEvent("CustomEvent");

  event.initCustomEvent("click", true, true, null);
  event.clientX = source.getBoundingClientRect().top / 2;
  event.clientY = source.getBoundingClientRect().left / 2;
  source.dispatchEvent(event);
};

// click the Rect on the Konva canvas
const clickRect = () => {
  const rect = window.Konva.stages[0].findOne("Rect");

  rect.fire("click", { clientX: 10, clientY: 10 });
};

/**
 * Click once on the main Stage
 * @param {number} x
 * @param {number} y
 * @param {function} done
 */
const clickKonva = (x, y, done) => {
  const stage = window.Konva.stages[0];

  stage.fire("click", { clientX: x, clientY: y, evt: { offsetX: x, offsetY: y, timeStamp: Date.now() } });
  done();
};

/**
 * Click multiple times on the Stage
 * @param {number[][]} points array of coords arrays ([[x1, y1], [x2, y2], ...])
 * @param {function} done
 */
const clickMultipleKonva = async (points, done) => {
  const stage = window.Konva.stages[0];
  const delay = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout));
  let lastPoint;

  for (const point of points) {
    if (lastPoint) {
      stage.fire("mousemove", { evt: { offsetX: point[0], offsetY: point[1], timeStamp: Date.now() } });
      await delay();
    }
    stage.fire("mousedown", { evt: { offsetX: point[0], offsetY: point[1], timeStamp: Date.now() } });
    await delay();
    stage.fire("mouseup", { evt: { offsetX: point[0], offsetY: point[1], timeStamp: Date.now() } });
    await delay();
    stage.fire("click", { evt: { offsetX: point[0], offsetY: point[1], timeStamp: Date.now() } });
    lastPoint = point;
    await delay();
  }
  done();
};

/**
 * Create Polygon on Stage by clicking multiple times and click on the first point at the end
 * @param {number[][]} points array of coords arrays ([[x1, y1], [x2, y2], ...])
 * @param {function} done
 */
const polygonKonva = async (points, done) => {
  try {
    const delay = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout));
    const stage = window.Konva.stages[0];

    for (const point of points) {
      stage.fire("click", {
        evt: {
          offsetX: point[0], offsetY: point[1], timeStamp: Date.now(), preventDefault: () => {},
        },
      });
      await delay(50);
    }

    // this works in 50% runs for no reason; maybe some async lazy calculations
    // const firstPoint = stage.getIntersection({ x, y });

    // Circles (polygon points) redraw every new click so we can find it only after last click
    const lastPoint = stage.find("Circle").slice(-1)[0];
    const firstPoint = lastPoint.parent.find("Circle")[0];
    // for closing the Polygon we should place cursor over the first point

    firstPoint.fire("mouseover");
    await delay(100);
    // and only after that we can click on it
    firstPoint.fire("click", {
      evt: {
        preventDefault: () => {},
      },
    });
    done();
  } catch (e) {
    done(String(e));
  }
};

/**
 * Click and hold, move the cursor (with one pause in the middle) and release the mouse
 * @param {number} x
 * @param {number} y
 * @param {number} shiftX
 * @param {number} shiftY
 * @param {function} done
 */
const dragKonva = async (x, y, shiftX, shiftY, done) => {
  const stage = window.Konva.stages[0];
  const delay = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout));

  stage.fire("mousedown", { evt: { offsetX: x, offsetY: y } });
  await delay();
  stage.fire("mousemove", { evt: { offsetX: x + (shiftX >> 1), offsetY: y + (shiftY >> 1) } });
  await delay();
  // we should move the cursor to the last point and only after that release the mouse
  stage.fire("mousemove", { evt: { offsetX: x + shiftX, offsetY: y + shiftY } });
  await delay();
  // because some events work on mousemove and not on mouseup
  stage.fire("mouseup", { evt: { offsetX: x + shiftX, offsetY: y + shiftY } });
  // looks like Konva needs some time to update image according to dpi
  await delay(32);
  done();
};

/**
 * Check if there is layer with given color at given coords
 * @param {number} x
 * @param {number} y
 * @param {number[]} rgbArray
 * @param {function} done
 * @param {number} tolerance
 */
const hasKonvaPixelColorAtPoint = (x, y, rgbArray, tolerance, done) => {
  const stage = window.Konva.stages[0];
  let result = false;

  const areEqualRGB = (a, b) => {
    for (let i = 3; i--; ) {
      if (Math.abs(a[i] - b[i]) > tolerance) {
        return false;
      }
    }
    return true;
  };

  for (const layer of stage.getLayers()) {
    const rgba = layer.getContext().getImageData(x, y, 1, 1).data;

    if (!areEqualRGB(rgbArray, rgba)) continue;

    result = true;
  }

  done(result);
  return;
};

const areEqualRGB = (a, b, tolerance) => {
  for (let i = 3; i--; ) {
    if (Math.abs(a[i] - b[i]) > tolerance) {
      return false;
    }
  }
  return true;
};

const getKonvaPixelColorFromPoint = (x, y, done) => {
  const stage = window.Konva.stages[0];
  const colors = [];

  for (const layer of stage.getLayers()) {
    const context = layer.getContext();
    const ratio = context.canvas.pixelRatio;
    const rgba = context.getImageData(x * ratio, y * ratio, 1, 1).data;

    colors.push(rgba);
  }

  done(colors);
};

const getCanvasSize = done => {
  const stage = window.Konva.stages[0];

  done({
    width: stage.width(),
    height: stage.height(),
  });
};
const getImageSize = done => {
  const image = window.document.querySelector('img[alt="LS"]');
  const clientRect = image.getBoundingClientRect();

  done({
    width: clientRect.width,
    height: clientRect.height,
  });
};
const getImageFrameSize = done => {
  const image = window.document.querySelector('img[alt="LS"]').parentElement;
  const clientRect = image.getBoundingClientRect();

  done({
    width: Math.round(clientRect.width),
    height: Math.round(clientRect.height),
  });
};
const setZoom = (scale, x, y, done) => {
  Htx.annotationStore.selected.objects.find(o => o.type === "image").setZoom(scale, x, y);
  setTimeout(() => {
    done();
  }, 30);
};

/**
 * Count shapes on Konva, founded by selector
 * @param {string|function} selector from Konva's finding methods params
 * @param {function} done
 */
const countKonvaShapes = async done => {
  const stage = window.Konva.stages[0];
  const regions = Htx.annotationStore.selected.regionStore.regions;
  let count = 0;

  regions.forEach(region => {
    count +=  stage.find("."+region.id).filter(node => node.isVisible()).length;
  });
  done(count);
};

const isTransformerExist = async done => {
  const stage = window.Konva.stages[0];
  const achors = stage.find("._anchor").filter(shape => shape.getAttr("visible") !== false);

  done(!!achors.length);
};

const isRotaterExist = async done => {
  const stage = window.Konva.stages[0];
  const achors = stage.find(".rotater").filter(shape => shape.getAttr("visible") !== false);

  done(!!achors.length);
};

const switchRegionTreeView = (viewName, done) => {
  Htx.annotationStore.selected.regionStore.setView(viewName);
  done();
};

const serialize = () => window.Htx.annotationStore.selected.serializeAnnotation();

const selectText = async ({ selector, rangeStart, rangeEnd }, done) => {
  const findOnPosition = (root, position, borderSide = "left") => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);

    let lastPosition = 0;
    let currentNode = walker.nextNode();
    let nextNode = walker.nextNode();

    while (currentNode) {
      const isText = currentNode.nodeType === Node.TEXT_NODE;
      const isBR = currentNode.nodeName === "BR";

      if (isText || isBR) {
        const length = currentNode.length ? currentNode.length : 1;

        if (length + lastPosition >= position || !nextNode) {
          if (borderSide === "right" && length + lastPosition === position && nextNode) {
            return { node: nextNode, position: 0 };
          }
          return { node: currentNode, position: isBR ? 0 : Math.min(Math.max(position - lastPosition, 0), length) };
        } else {
          lastPosition += length;
        }
      }

      currentNode = nextNode;
      nextNode = walker.nextNode();
    }
  };

  const elem = document.querySelector(selector);

  const start = findOnPosition(elem, rangeStart, "right");
  const end = findOnPosition(elem, rangeEnd, "left");

  const range = new Range();

  range.setStart(start.node, start.position);
  range.setEnd(end.node, end.position);

  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  const evt = new MouseEvent("mouseup");

  evt.initMouseEvent("mouseup", true, true);
  elem.dispatchEvent(evt);

  done();
};

// Only for debugging
const whereIsPixel = (rgbArray, tolerance, done) => {
  const stage = window.Konva.stages[0];
  const areEqualRGB = (a, b) => {
    for (let i = 3; i--; ) {
      if (Math.abs(a[i] - b[i]) > tolerance) {
        return false;
      }
    }
    return true;
  };
  const points = [];

  for (const layer of stage.getLayers()) {
    const canvas = layer.getCanvas();

    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const rgba = layer.getContext().getImageData(x, y, 1, 1).data;

        if (areEqualRGB(rgbArray, rgba)) {
          points.push([x, y]);
        }
      }
    }
  }
  done(points);
};

const dumpJSON = (obj) => {
  console.log(JSON.stringify(obj, null, '  '));
};

function _isObject(value) {
  const type = typeof value;

  return value !== null && (type === "object" || type === "function");
}

function _pickBy(obj, predicate, path = []) {
  if (!_isObject(obj) || Array.isArray(obj)) return obj;
  return Object.keys(obj).reduce((res, key) => {
    const val = obj[key];
    const fullPath = [...path, key];

    if (predicate(val, key, fullPath)) {
      res[key] = _pickBy(val, predicate, fullPath);
    }
    return res;
  }, {});
}

function _not(predicate) {
  return (...args) => {
    return !predicate(...args);
  };
}

function omitBy(object, predicate) {
  return _pickBy(object, _not(predicate));
}

function hasSelectedRegion(done) {
  done(!!Htx.annotationStore.selected.highlightedNode);
}

module.exports = {
  initLabelStudio,
  createAddEventListenerScript,
  setFeatureFlags,
  waitForImage,
  waitForAudio,
  delay,

  getSizeConvertor,
  convertToFixed,

  emulateClick,
  clickRect,
  clickKonva,
  clickMultipleKonva,
  polygonKonva,
  dragKonva,
  areEqualRGB,
  hasKonvaPixelColorAtPoint,
  getKonvaPixelColorFromPoint,
  getCanvasSize,
  getImageSize,
  getImageFrameSize,
  setZoom,
  whereIsPixel,
  countKonvaShapes,
  isTransformerExist,
  isRotaterExist,
  switchRegionTreeView,
  hasSelectedRegion,

  serialize,
  selectText,

  omitBy,
  dumpJSON,
};
