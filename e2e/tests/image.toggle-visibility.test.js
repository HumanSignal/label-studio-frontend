/* global Feature, Scenario, locate */

const assert = require("assert");
const { initLabelStudio, waitForImage, countKonvaShapes, switchRegionTreeView } = require("./helpers");

const ALL_VISIBLE_SELECTOR = ".lsf-entities__visibility [aria-label=eye]";
const ALL_HIDDEN_SELECTOR = ".lsf-entities__visibility [aria-label=eye-invisible]";
const ONE_VISIBLE_SELECTOR = ".lsf-region-item__toggle [aria-label=eye]";
const ONE_HIDDEN_SELECTOR = ".lsf-region-item__toggle [aria-label=eye-invisible]";

const config = `
<View>
  <Image name="img" value="$image"></Image>
  <RectangleLabels name="tag" toName="img" fillOpacity="0.5" strokeWidth="5">
    <Label value="Planet"></Label>
    <Label value="Moonwalker" background="blue"></Label>
  </RectangleLabels>
</View>
`;

const data = {
  image:
    "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg",
};

const createRegion = (from_name, type, values) => ({
  id: createRegion.id++,
  source: "$image",
  from_name,
  to_name: "img",
  type,
  value: {
    height: 10.458911419423693,
    rotation: 0,
    width: 12.4,
    x: 50.8,
    y: 5.869797225186766,
    ...values,
  },
});
createRegion.id = 1;

const annotations = [
  {
    id: "1001",
    lead_time: 15.053,
    result: [
      createRegion("tag", "rectanglelabels", { rectanglelabels: ["Moonwalker"] }),
      createRegion("tag", "rectanglelabels", { rectanglelabels: ["Moonwalker"], x: 1 }),
      createRegion("tag", "rectanglelabels", { rectanglelabels: ["Moonwalker"], y: 60 }),
    ],
  },
];

Feature("Toggle image's regions visibility");

Scenario("Checking mass toggling of visibility", async (I, AtImageView) => {
  const checkVisible = async num => {
    switch (num) {
      case 0:
        I.seeElement(ALL_HIDDEN_SELECTOR);
        I.seeElement(ONE_HIDDEN_SELECTOR);
        I.dontSeeElement(ONE_VISIBLE_SELECTOR);
        break;
      case 1:
      case 2:
        I.seeElement(ALL_VISIBLE_SELECTOR);
        I.seeElement(ONE_VISIBLE_SELECTOR);
        I.seeElement(ONE_HIDDEN_SELECTOR);
        break;
      case 3:
        I.seeElement(ALL_VISIBLE_SELECTOR);
        I.seeElement(ONE_VISIBLE_SELECTOR);
        I.dontSeeElement(ONE_HIDDEN_SELECTOR);
        break;
    }
    let count = await I.executeAsyncScript(countKonvaShapes);
    assert.strictEqual(count, num);
  };
  const hideAll = () => {
    I.click(ALL_VISIBLE_SELECTOR);
  };
  const showAll = () => {
    I.click(ALL_HIDDEN_SELECTOR);
  };
  const hideOne = () => {
    I.click(ONE_VISIBLE_SELECTOR);
  };
  const showOne = () => {
    I.click(ONE_HIDDEN_SELECTOR);
  };

  await I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, { annotations, config, data });
  AtImageView.waitForImage();
  I.waitForVisible("canvas", 3);
  I.see("3 Regions");
  await checkVisible(3);
  hideOne();
  await checkVisible(2);
  showOne();
  await checkVisible(3);
  hideAll();
  await checkVisible(0);
  showOne();
  await checkVisible(1);
  hideOne();
  await checkVisible(0);
  showAll();
  await checkVisible(3);
  hideOne();
  await checkVisible(2);
  hideAll();
  await checkVisible(0);
});

Scenario("Hiding bulk visibility toggle", (I, AtImageView) => {
  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, { config, data });
  AtImageView.waitForImage();
  I.waitForVisible("canvas", 3);
  I.see("0 Regions");
  I.dontSeeElement(ALL_VISIBLE_SELECTOR);
  I.click(locate(".ant-tag").withText("Planet"));
  AtImageView.dragKonva(300, 300, 50, 50);
  I.see("1 Region");
  I.seeElement(ALL_VISIBLE_SELECTOR);
});

Scenario("Checking regions grouped by label", async (I, AtImageView) => {
  const checkVisible = async num => {
    switch (num) {
      case 0:
        I.seeElement(ALL_HIDDEN_SELECTOR);
        I.seeElement(ONE_HIDDEN_SELECTOR);
        I.dontSeeElement(ONE_VISIBLE_SELECTOR);
        break;
      case 1:
      case 2:
        I.seeElement(ALL_VISIBLE_SELECTOR);
        I.seeElement(ONE_VISIBLE_SELECTOR);
        I.seeElement(ONE_HIDDEN_SELECTOR);
        break;
      case 3:
        I.seeElement(ALL_VISIBLE_SELECTOR);
        I.seeElement(ONE_VISIBLE_SELECTOR);
        I.dontSeeElement(ONE_HIDDEN_SELECTOR);
        break;
    }
    let count = await I.executeAsyncScript(countKonvaShapes);
    assert.strictEqual(count, num);
  };
  const hideAll = () => {
    I.click(ALL_VISIBLE_SELECTOR);
  };
  const showAll = () => {
    I.click(ALL_HIDDEN_SELECTOR);
  };
  const hideOne = () => {
    I.click(ONE_VISIBLE_SELECTOR);
  };
  const showOne = () => {
    I.click(ONE_HIDDEN_SELECTOR);
  };

  await I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, { annotations, config, data });
  AtImageView.waitForImage();
  I.waitForVisible("canvas", 3);
  I.executeAsyncScript(switchRegionTreeView, "labels");
  I.see("Labels");
  await checkVisible(3);
  hideOne();
  await checkVisible(2);
  showOne();
  await checkVisible(3);
  hideAll();
  await checkVisible(0);
  showOne();
  await checkVisible(1);
  hideOne();
  await checkVisible(0);
  showAll();
  await checkVisible(3);
  hideOne();
  await checkVisible(2);
  hideAll();
  await checkVisible(0);
});
