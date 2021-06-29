/* global Feature, DataTable, Data, locate */

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

Data(shapesTable).Scenario("Selecting after creation", async function({I, AtImageView, AtSidebar, current}) {
  const params = {
    config: getConfigWithShape(current.shape, current.props),
    data: { image: IMAGE },
  };

  I.amOnPage("/");
  await I.executeAsyncScript(initLabelStudio, params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);
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
  I.seeElement(locate(".ant-list-item[class*='selected--']"));
  I.seeElement(locate(".lsf-entity"));
});
