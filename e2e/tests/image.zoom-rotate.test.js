/* global Feature, DataTable, Data, locate, Scenario */

const { serialize } = require("./helpers");

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
    action: "clickPolygonPointsKonva",
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

Data(shapesTable).Scenario("Simple rotation", async function({ I, LabelStudio, AtImageView, AtSidebar, current }) {
  const config = getConfigWithShape(current.shape, current.props);

  const params = {
    config,
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);
  const canvasSize = await AtImageView.getCanvasSize();

  for (let region of current.regions) {
    I.pressKey(["u"]);
    I.pressKey("1");
    AtImageView[current.action](...region.params);
  }
  const standard = await I.executeScript(serialize);
  const rotationQueue = ["right", "right", "right", "right", "left", "left", "left", "left"];
  let degree = 0;
  let hasPixel = await AtImageView.hasPixelColor(100, 100, BLUEVIOLET.rgbArray);

  assert.equal(hasPixel, true);
  for (let rotate of rotationQueue) {
    I.click(locate(`[aria-label='rotate-${rotate}']`));
    degree += rotate === "right" ? 90 : -90;
    hasPixel = await AtImageView.hasPixelColor(
      ...rotateCoords([100, 100], degree, canvasSize.width, canvasSize.height).map(Math.round),
      BLUEVIOLET.rgbArray,
    );
    assert.strictEqual(hasPixel, true);
    const result = await I.executeScript(serialize);

    for (let i = 0; i < standard.length; i++) {
      assert.deepEqual(standard[i].result, result[i].result);
    }
  }
});

Data(shapesTable).Scenario("Rotate zoomed", async function({ I, LabelStudio, AtImageView, AtSidebar, current }) {
  const params = {
    config: getConfigWithShape(current.shape, current.props),
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);
  const canvasSize = await AtImageView.getCanvasSize();

  for (let region of current.regions) {
    I.pressKey(["u"]);
    I.pressKey("1");
    AtImageView[current.action](...region.params);
  }
  const rotationQueue = ["right", "right", "right", "right", "left", "left", "left", "left"];
  let degree = 0;
  const ZOOM = 3;

  AtImageView.setZoom(ZOOM, -100 * ZOOM, -100 * ZOOM);
  let hasPixel = await AtImageView.hasPixelColor(1, 1, BLUEVIOLET.rgbArray);

  assert.strictEqual(hasPixel, true);
  for (let rotate of rotationQueue) {
    I.click(locate(`[aria-label='rotate-${rotate}']`));
    degree += rotate === "right" ? 90 : -90;
    hasPixel = await AtImageView.hasPixelColor(
      ...rotateCoords([1, 1], degree, canvasSize.width, canvasSize.height).map(Math.round),
      BLUEVIOLET.rgbArray,
    );

    assert.strictEqual(hasPixel, true);
  }
});

const windowSizesTable = new DataTable(["width", "height"]);

windowSizesTable.add([1280, 720]);
windowSizesTable.add([1920, 1080]);
windowSizesTable.add([800, 480]);
windowSizesTable.add([1017, 970]);

Data(windowSizesTable).Scenario("Rotation with different window sizes", async function({ I, LabelStudio, AtImageView, AtSidebar, current }) {
  const config = getConfigWithShape("Rectangle");

  console.log(config);
  const params = {
    config,
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  I.resizeWindow(current.width, current.height);
  LabelStudio.init(params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);
  const canvasSize = await AtImageView.getCanvasSize();
  const imageSize = await AtImageView.getImageFrameSize();
  const rotationQueue = ["right", "right", "right", "right", "left", "left", "left", "left"];

  assert(Math.abs(canvasSize.width - imageSize.width) < 1);
  assert(Math.abs(canvasSize.height - imageSize.height) < 1);
  for (let rotate of rotationQueue) {
    I.click(locate(`[aria-label='rotate-${rotate}']`));
    const rotatedCanvasSize = await AtImageView.getCanvasSize();
    const rotatedImageSize = await AtImageView.getImageFrameSize();

    assert(Math.abs(rotatedCanvasSize.width - rotatedImageSize.width) < 1);
    assert(Math.abs(rotatedCanvasSize.height - rotatedImageSize.height) < 1);
  }
});

const twoColumnsConfigs = [`<View>
    <View style="display:flex;align-items:start;gap:8px;flex-direction:{{direction}}">
        <RectangleLabels name="label" toName="image" showInline="{{showInline}}">
            <Label value="Label 1" background="#2C7873"/>
            <Label value="Label 2" background="#7232F2"/>
        </RectangleLabels>
        <Image name="image" value="$image" zoom="true" rotateControl="true"/>
    </View>
</View>`, `<View>
    <View style="display:flex;align-items:start;gap:8px;flex-direction:{{direction}}">
        <RectangleLabels name="label" toName="image" showInline="{{showInline}}">
            <Label value="Label 1" background="#2C7873"/>
            <Label value="Label 2" background="#7232F2"/>
        </RectangleLabels>
        <View style="flex: 100 0 1%; width: 100%">
            <Image name="image" value="$image" zoom="true" rotateControl="true"/>
        </View>
    </View>
</View>`];

Scenario("Rotation in the two columns template", async function({ I, LabelStudio, AtImageView, AtSidebar, AtSettings }) {
  I.amOnPage("/");
  let isVerticalLayout = false;

  for (const config of twoColumnsConfigs) {
    for (const inline of [true, false]) {
      for (const reversed of [true, false]) {

        const direction = (inline ? "column" : "row") + (reversed ? "-reverse" : "");
        const params = {
          config: config.replace("{{direction}}", direction).replace("{{showInline}}",`${inline}`),
          data: { image: IMAGE },
        };

        LabelStudio.init(params);
        AtImageView.waitForImage();
        AtSidebar.seeRegions(0);
        I.click(locate(`[aria-label='rotate-right']`));
        let rotatedCanvasSize,rotatedImageSize;

        rotatedCanvasSize = await AtImageView.getCanvasSize();
        rotatedImageSize = await AtImageView.getImageFrameSize();
        assert(Math.abs(rotatedCanvasSize.width - rotatedImageSize.width) < 1);
        assert(Math.abs(rotatedCanvasSize.height - rotatedImageSize.height) < 1);
        AtSettings.open();
        isVerticalLayout = !isVerticalLayout;
        AtSettings.setLayoutSettings({
          [AtSettings.LAYOUT_SETTINGS.VERTICAL_LAYOUT]: isVerticalLayout,
        });
        AtSettings.close();
        rotatedCanvasSize = await AtImageView.getCanvasSize();
        rotatedImageSize = await AtImageView.getImageFrameSize();
        assert(Math.abs(rotatedCanvasSize.width - rotatedImageSize.width) < 1);
        assert(Math.abs(rotatedCanvasSize.height - rotatedImageSize.height) < 1);
        I.click(locate(`[aria-label='rotate-right']`));
        rotatedCanvasSize = await AtImageView.getCanvasSize();
        rotatedImageSize = await AtImageView.getImageFrameSize();
        assert(Math.abs(rotatedCanvasSize.width - rotatedImageSize.width) < 1);
        assert(Math.abs(rotatedCanvasSize.height - rotatedImageSize.height) < 1);
      }
    }
  }
});
