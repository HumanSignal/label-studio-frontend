/* global Feature Scenario locate */

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
    "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg",
};

Feature("Two or more same named tools referred same image").tag("@regress");

Scenario("Two RectangleLabels", async ({I, AtImageView}) => {
  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, { config, data });

  AtImageView.waitForImage();
  I.executeAsyncScript(waitForImage);

  I.click(locate(".ant-tag").withText("Plane"));
  I.executeAsyncScript(dragKonva, 300, 300, 50, 50);
  I.click(locate(".ant-tag").withText("Car"));
  I.executeAsyncScript(dragKonva, 100, 600, 400, -300);
  I.see("2 Regions");

  const result = await I.executeScript(serialize);
  assert.deepStrictEqual(result.length, 2);
});
