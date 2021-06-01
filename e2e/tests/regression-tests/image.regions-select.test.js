/* global Feature, Scenario, DataTable, Data, locate */

const { initLabelStudio, hasSelectedRegion } = require("../helpers");

const assert = require("assert");

Feature("Select region by click on it");

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
    shape: "Polygon",
    action: "drawByClickingPoints",
    regions: [
      {
        params: [
          [
            [5, 5],
            [5, 55],
            [55, 55],
            [55, 5],
            [5, 5]
          ],
        ],
      },
    ],
  },
  {
    shape: "Rectangle",
    action: "drawByDrag",
    regions: [
      {
        params: [5, 5, 55, 55],
      },
    ],
  },
  {
    shape: "Ellipse",
    action: "drawByDrag",
    regions: [
      {
        params: [30, 30, 25, 25],
      }
    ],
  },
  {
    shape: "KeyPoint",
    props: 'strokeWidth="5"',
    action: "drawByClick",
    regions: [
      {
        params: [30, 30],
      }
    ],
  },
  {
    shape: "Brush",
    action: "drawThroughPoints",
    regions: [
      {
        params: [
          [
            [5, 5],
            [30, 30],
            [55, 55],
            [5, 55],
            [30, 30],
            [55, 5],
            [5, 5],
          ],
        ],
      },
    ],
  },
];
const shapesTable = new DataTable(["shape", "props", "action", "regions"]);
shapes.forEach(({ shape, props = "", action, regions }) => {
  shapesTable.add([shape, props, action, regions]);
});

function convertParamsToPixels(params, canvasSize, key = "width") {
  if (Array.isArray(params)) {
    for (const idx in params) {
      params[idx] = convertParamsToPixels(params[idx], canvasSize, idx % 2 ? "height" : "width");
    }
  } else {
    params = canvasSize[key] / 100 * params;
  }
  return params;
}

Data(shapesTable).Scenario("Selecting after creation", async function(I, AtImageView, current) {
  const params = {
    config: getConfigWithShape(current.shape, current.props),
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  await I.executeAsyncScript(initLabelStudio, params);
  AtImageView.waitForImage();
  I.waitForVisible("canvas");
  I.see("0 Regions");
  await AtImageView.lookForStage();
  const canvasSize = await AtImageView.getCanvasSize();
  for (let region of current.regions) {
    I.pressKey("u");
    I.pressKey("1");
    AtImageView[current.action](...convertParamsToPixels(region.params, canvasSize));
  }
  I.pressKey("u");
  if (current.shape === "Brush") {
    I.click(locate("button.ant-btn-primary").withDescendant(".anticon.anticon-highlight"));
  }
  AtImageView.clickAt(canvasSize.width * 0.3, canvasSize.height * 0.3);
  const selected = await I.executeAsyncScript(hasSelectedRegion);
  console.log("selected", selected);
  assert.strictEqual(selected, true);
});