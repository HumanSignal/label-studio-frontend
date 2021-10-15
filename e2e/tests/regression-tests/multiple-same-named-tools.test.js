/* global Feature Scenario */

const { initLabelStudio, dragKonva, waitForImage, serialize } = require("../helpers");
const assert = require("assert");

const config = `
  <View>
    <Image name="image" value="$image" zoomcontrol="true"/>
    <RectangleLabels name="label" toName="image">
        <Label value="Airplane" background="green"/>
        <Label value="Car" background="blue"/>
    </RectangleLabels>
    <RectangleLabels name="label2" toName="image">
        <Label value="F1"/>
        <Label value="Plane"/>
    </RectangleLabels>
  </View>
`;

const data = {
  image:
    "/images/astro-visuals.jpg",
};

Feature("Two or more same named tools referred same image").tag("@regress");

Scenario("Two RectangleLabels", async ({ I, AtImageView, AtLabels, AtSidebar }) => {
  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, { config, data });

  AtImageView.waitForImage();
  I.executeAsyncScript(waitForImage);

  AtLabels.clickLabel("Plane");
  I.executeAsyncScript(dragKonva, 300, 300, 50, 50);
  AtLabels.clickLabel("Car");
  I.executeAsyncScript(dragKonva, 100, 600, 400, -300);
  AtSidebar.seeRegions(2);

  const result = await I.executeScript(serialize);

  assert.deepStrictEqual(result.length, 2);
});
