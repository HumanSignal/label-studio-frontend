/* global Feature, Scenario, locate */

const { initLabelStudio, clickRect } = require("./helpers");

Feature("Test Image object");

const config = `
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>`;

const completionMoonwalker = {
  id: "1001",
  lead_time: 15.053,
  result: [
    {
      from_name: "tag",
      id: "Dx_aB91ISN",
      source: "$image",
      to_name: "img",
      type: "rectanglelabels",
      value: {
        height: 10.458911419423693,
        rectanglelabels: ["Moonwalker"],
        rotation: 0,
        width: 12.4,
        x: 50.8,
        y: 5.869797225186766,
      },
    },
  ],
};

const image =
  "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg";

Scenario("Check Rect region for Image", async function(I) {
  const params = {
    config,
    data: { image },
    completions: [completionMoonwalker],
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.waitForVisible("canvas");
  I.see("Regions (1)");
  // select first and only region
  I.click(locate("li").withText("Rectangle"));
  I.see("Labels:");
  I.wait(2);

  // click on region's rect on the canvas
  I.executeScript(clickRect);
  I.dontSee("Labels:");
  I.wait(2);
});
