/* global Feature, Scenario, locate */

const { initLabelStudio, clickRect, serialize, waitForImage } = require("./helpers");

const assert = require("assert");

Feature("Test Image object");

const config = `
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>`;

const perRegionConfig = `
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
    <TextArea name="answer" toName="img" perRegion="true" />
  </View>`;

const createRegion = (from_name, type, values) => ({
  id: "Dx_aB91ISN",
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

const annotationMoonwalker = {
  id: "1001",
  lead_time: 15.053,
  result: [createRegion("tag", "rectanglelabels", { rectanglelabels: ["Moonwalker"] })],
};

// perregion regions have the same id as main region
// and their own data (`text` in this case)
const annotationWithPerRegion = {
  id: "1002",
  result: [annotationMoonwalker.result[0], createRegion("answer", "textarea", { text: ["blah"] })],
};

const image =
  "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg";

Scenario("Check Rect region for Image", async function(I) {
  const params = {
    config,
    data: { image },
    annotations: [annotationMoonwalker],
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.waitForVisible("canvas", 3);
  I.executeAsyncScript(waitForImage);
  I.see("1 Region");
  // select first and only region
  I.click(locate("li").withText("Rectangle"));
  I.see("Labels:");

  // click on region's rect on the canvas
  I.executeScript(clickRect);
  I.dontSee("Labels:");
});

Scenario("Image with perRegion tags", async function(I) {
  let result;
  const params = {
    config: perRegionConfig,
    data: { image },
    annotations: [annotationWithPerRegion],
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.waitForVisible("canvas", 3);
  I.executeAsyncScript(waitForImage);
  I.see("1 Region");
  // select first and only region
  I.click(locate("li").withText("Rectangle"));
  I.see("Labels:");

  // check that there is deserialized text for this region; and without doubles
  I.seeNumberOfElements(locate("mark").withText("blah"), 1);

  // add another note via textarea
  I.fillField("[name=answer]", "another");
  I.pressKey("Enter");
  // texts are concatenated in the regions list (now with \n, so check separately)
  I.seeNumberOfElements(locate("mark").withText("blah"), 1);
  I.seeNumberOfElements(locate("mark").withText("another"), 1);
  // and there is only one tag with all these texts
  I.seeNumberOfElements("mark", 1);

  // serialize with two textarea regions
  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, "Dx_aB91ISN");
  assert.strictEqual(result[1].id, "Dx_aB91ISN");
  assert.deepStrictEqual(result[0].value.rectanglelabels, ["Moonwalker"]);
  assert.deepStrictEqual(result[1].value.text, ["blah", "another"]);

  // delete first deserialized text and check that only "another" left
  I.click(locate("[aria-label=delete]").inside('[data-testid="textarea-region"]'));
  I.dontSeeElement(locate("mark").withText("blah"));
  I.seeElement(locate("mark").withText("another"));

  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 2);
  assert.deepStrictEqual(result[0].value.rectanglelabels, ["Moonwalker"]);
  assert.deepStrictEqual(result[1].value.text, ["another"]);

  // delete also "another" region
  I.click(locate("[aria-label=delete]").inside('[data-testid="textarea-region"]'));
  // there are should be no texts left at all
  I.dontSeeElement(locate("mark"));

  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].value.rectanglelabels, ["Moonwalker"]);
});
