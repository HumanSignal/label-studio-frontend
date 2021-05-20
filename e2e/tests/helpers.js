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
const initLabelStudio = async ({ config, data, annotations = [{ result: [] }], predictions = [] }, done) => {
  if (window.Konva && window.Konva.stages.length) window.Konva.stages.forEach(stage => stage.destroy());

  const interfaces = [
    "panel",
    "update",
    "submit",
    "controls",
    "side-column",
    "annotations:history",
    "annotations:current",
    "annotations:tabs",
    "annotations:menu",
    "annotations:add-new",
    "annotations:delete",
    "predictions:tabs",
    "predictions:menu",
  ];
  const task = { data, annotations, predictions };

  window.LabelStudio.destroyAll();
  new window.LabelStudio("label-studio", { interfaces, config, task });
  done();
};

/**
 * Wait for the main Image object to be loaded
 * @param {function} done codecept async success handler
 */
const waitForImage = async done => {
  const img = document.querySelector("[alt=LS]");
  if (!img || img.complete) return done();
  img.onload = done;
};

/**
 * Float numbers can't be compared strictly, so convert any numbers or structures with numbers
 * to same structures but with rounded numbers (int for ints, fixed(2) for floats)
 * @param {*} data
 */
const convertToFixed = data => {
  if (["string", "number"].includes(typeof data)) {
    const n = Number(data);
    return Number.isNaN(n) ? data : Number.isInteger(n) ? n : +Number(n).toFixed(2);
  }
  if (Array.isArray(data)) {
    return data.map(n => convertToFixed(n));
  }
  if (typeof data === "object") {
    const result = {};
    for (let key in data) {
      result[key] = convertToFixed(data[key]);
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
      for (let key in data) {
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
  for (let point of points) {
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
    for (let point of points) {
      stage.fire("click", {
        evt: { offsetX: point[0], offsetY: point[1], timeStamp: Date.now(), preventDefault: () => {} },
      });
      await delay();
    }

    // this works in 50% runs for no reason; maybe some async lazy calculations
    // const firstPoint = stage.getIntersection({ x, y });

    // Circles (polygon points) redraw every new click so we can find it only after last click
    const lastPoint = stage.find("Circle").slice(-1)[0];
    const firstPoint = lastPoint.parent.find("Circle")[0];
    // for closing the Polygon we should place cursor over the first point
    firstPoint.fire("mouseover");
    await delay();
    // and only after that we can click on it
    firstPoint.fire("click", { evt: { preventDefault: () => {} } });
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
  const areEqualRGB = (a, b) => {
    for (let i = 3; i--; ) {
      if (Math.abs(a[i] - b[i]) > tolerance) {
        return false;
      }
    }
    return true;
  };
  for (let layer of stage.getLayers()) {
    const rgba = layer.getContext().getImageData(x, y, 1, 1).data;
    if (areEqualRGB(rgbArray, rgba)) {
      done(true);
      return;
    }
  }
  done(false);
  return;
};
const getCanvasSize = done => {
  const stage = window.Konva.stages[0];
  done({ width: stage.width(), height: stage.height() });
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
  const count = stage.find(node => {
    return node.getType() === "Shape" && node.isVisible();
  }).length;
  done(count);
};

const switchRegionTreeView = (viewName, done) => {
  Htx.annotationStore.selected.regionStore.setView(viewName);
  done();
};

const serialize = () => window.Htx.annotationStore.selected.serializeAnnotation();

const selectText = async ({ selector, rangeStart, rangeEnd }, done) => {
  const findOnPosition = (root, position, byNode = false) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);

    let lastPosition = position;
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE || currentNode.nodeName === "BR") {
        let length = byNode ? 1 : currentNode.length;

        if (length === undefined || length === null) {
          length = 1;
        }

        if (length >= lastPosition) {
          return { node: currentNode, position: lastPosition };
        } else {
          lastPosition -= length;
        }
      }

      currentNode = walker.nextNode();
    }
  };

  const elem = document.querySelector(selector);

  const start = findOnPosition(elem, rangeStart);
  const end = findOnPosition(elem, rangeEnd);

  const range = new Range();
  range.setStart(start.node, start.position);
  range.setEnd(end.node, end.position);

  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  const evt = new MouseEvent('mouseup');
  evt.initMouseEvent('mouseup', true, true);
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
  let points = [];
  for (let layer of stage.getLayers()) {
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

module.exports = {
  initLabelStudio,
  waitForImage,
  delay,

  getSizeConvertor,
  convertToFixed,

  emulateClick,
  clickRect,
  clickKonva,
  clickMultipleKonva,
  polygonKonva,
  dragKonva,
  hasKonvaPixelColorAtPoint,
  getCanvasSize,
  setZoom,
  whereIsPixel,
  countKonvaShapes,
  switchRegionTreeView,

  serialize,
  selectText,
};
