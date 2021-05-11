/* global Feature, Scenario */

const { initLabelStudio, serialize } = require("./helpers");

const assert = require("assert");

Feature("Zooming and rotating");

const IMAGE =
  "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg";

const BLUEVIOLET = {
  color: "#8A2BE2",
  rgbArray: [138, 43, 226],
};
const getConfigWithShape = (shape, props = "") => `
  <View>
    <Image name="img" value="$image" zoom="true" zoomBy="1.5" zoomControl="true" rotateControl="true"></Image>
    <${shape}Labels ${props} name="tag" toName="img">
        <Label value="Test" background="${BLUEVIOLET.color}"></Label>
    </${shape}Labels>
  </View>`;

const hScaleCoords = ([x, y], w, h) => {
  const ratio = w / h;
  return [x * ratio, y * ratio];
};
const rotateCoords = (point, degree, w, h) => {
  const [x, y] = point;
  if (!degree) return point;

  degree = (360 + degree) % 360;
  if (degree === 90) return hScaleCoords([h - y - 1, x], w, h);
  if (degree === 270) return hScaleCoords([y, w - x - 1], w, h);
  if (Math.abs(degree) === 180) return [w - x - 1, h - y - 1];
  return [x, y];
};

const shapes = [
  {
    shape: "KeyPoint",
    props: 'strokeWidth="5"',
    action: "clickKonva",
    regions: [
      {
        params: [100, 100],
      },
      {
        params: [200, 100],
      },
    ],
  },
  {
    shape: "Polygon",
    action: "clickPointsKonva",
    regions: [
      {
        params: [
          [
            [95, 95],
            [95, 105],
            [105, 105],
            [105, 95],
          ],
        ],
      },
      {
        params: [
          [
            [400, 10],
            [400, 90],
            [370, 30],
            [300, 10],
          ],
        ],
      },
    ],
  },
  {
    shape: "Rectangle",
    action: "dragKonva",
    regions: [
      {
        params: [95, 95, 10, 10],
      },
      {
        params: [400, 350, -50, -50],
      },
    ],
  },
  {
    shape: "Ellipse",
    action: "dragKonva",
    regions: [
      {
        params: [100, 100, 10, 10],
      },
      {
        params: [230, 300, -50, -30],
      },
    ],
  },
];
const shapesTable = new DataTable(["shape", "props", "action", "regions"]);
shapes.forEach(({ shape, props = "", action, regions }) => {
  shapesTable.add([shape, props, action, regions]);
});

Data(shapesTable).Scenario("Simple rotation", async function(I, AtImageView, current) {
  const params = {
    config: getConfigWithShape(current.shape, current.props),
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  await I.executeAsyncScript(initLabelStudio, params);
  AtImageView.waitForImage();
  I.waitForVisible("canvas");
  I.see("Regions (0)");
  const canvasSize = await AtImageView.getCanvasSize();
  for (let region of current.regions) {
    I.pressKey("u");
    I.pressKey("1");
    AtImageView[current.action](...region.params);
  }
  const standard = await I.executeScript(serialize);
  const rotationQueue = ["right", "right", "right", "right", "left", "left", "left", "left"];
  let degree = 0;
  let hasPixel = await AtImageView.hasPixelColor(100, 100, BLUEVIOLET.rgbArray);
  assert.equal(hasPixel, true);
  for (let rotate of rotationQueue) {
    I.click(locate("button").withDescendant(`[aria-label='rotate-${rotate}']`));
    degree += rotate === "right" ? 90 : -90;
    hasPixel = await AtImageView.hasPixelColor(
      ...rotateCoords([100, 100], degree, canvasSize.width, canvasSize.height).map(Math.round),
      BLUEVIOLET.rgbArray,
    );
    assert.equal(hasPixel, true);
    const result = await I.executeScript(serialize);
    for (let i = 0; i < standard.length; i++) {
      assert.deepEqual(standard[i].result, result[i].result);
    }
  }
});

Data(shapesTable).Scenario("Rotate zoomed", async function(I, AtImageView, current) {
  const params = {
    config: getConfigWithShape(current.shape, current.props),
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  await I.executeAsyncScript(initLabelStudio, params);
  AtImageView.waitForImage();
  I.waitForVisible("canvas");
  I.see("Regions (0)");
  const canvasSize = await AtImageView.getCanvasSize();
  for (let region of current.regions) {
    I.pressKey("u");
    I.pressKey("1");
    AtImageView[current.action](...region.params);
  }
  const rotationQueue = ["right", "right", "right", "right", "left", "left", "left", "left"];
  let degree = 0;
  const ZOOM = 3;
  AtImageView.setZoom(ZOOM, -100 * ZOOM, -100 * ZOOM);
  let hasPixel = await AtImageView.hasPixelColor(1, 1, BLUEVIOLET.rgbArray);
  if (!hasPixel) {
    // Debugging info
    const points = await AtImageView.whereIsPixel(BLUEVIOLET.rgbArray);
    console.log(`points`, JSON.stringify(points));
  }
  assert.equal(hasPixel, true);
  for (let rotate of rotationQueue) {
    I.click(locate("button").withDescendant(`[aria-label='rotate-${rotate}']`));
    degree += rotate === "right" ? 90 : -90;
    hasPixel = await AtImageView.hasPixelColor(
      ...rotateCoords([1, 1], degree, canvasSize.width, canvasSize.height).map(Math.round),
      BLUEVIOLET.rgbArray,
    );
    if (!hasPixel) {
      // Debugging info
      const points = await AtImageView.whereIsPixel(BLUEVIOLET.rgbArray);
      console.log(`points`, JSON.stringify(points));
    }
    assert.equal(hasPixel, true);
  }
});
