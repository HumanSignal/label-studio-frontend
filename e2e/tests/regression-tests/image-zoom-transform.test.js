/* global Feature, Scenario */
const assert = require('assert');

Feature('Zoomed transforms').tag('@regress');

const IMAGE = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg';

const config = `
  <View>
    <Image name="img" value="$image" zoomby="2"/>
    <Rectangle name="rect" toName="img"/>
  </View>`;

Scenario('Transforming the region on the border of zoomed image', async ({ I, LabelStudio, AtImageView, AtSidebar }) => {
  const params = {
    config,
    data: { image: IMAGE },
  };

  I.amOnPage('/');

  LabelStudio.setFeatureFlags({
    'ff_front_dev_2394_zoomed_transforms_260522_short': true,
  });
  LabelStudio.init(params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);

  // Zoom in
  I.click('[aria-label=\'zoom-in\']');

  const canvasSize = await AtImageView.getCanvasSize();

  // Pan image to the left to see its right border
  I.pressKeyDown('Shift');
  AtImageView.drawByDrag(canvasSize.width - 10, canvasSize.height / 2, -canvasSize.width + 20, 0);
  I.pressKeyUp('Shift');
  // Create the region at the right border of the image
  AtImageView.drawByDrag(canvasSize.width - 30, canvasSize.height / 2 , 20, canvasSize.height / 2);
  AtSidebar.seeRegions(1);
  // Select this region
  AtImageView.clickAt(canvasSize.width - 20, canvasSize.height / 2 + 10);
  AtSidebar.seeSelectedRegion();
  // Rotate by the rotator anchor (heuristically calculated coordinates)
  AtImageView.drawThroughPoints([[canvasSize.width - 20, canvasSize.height / 2 - 50], [canvasSize.width / 2, canvasSize.height / 2]],  'steps', 50);

  const results = await LabelStudio.serialize();

  // The angle of rotation should not exceed 30 degrees
  assert.strictEqual(((results[0].value.rotation + 30) % 360) < 60, true);
});

Scenario('Transforming the region on the border of zoomed image after window resize', async ({ I, LabelStudio, AtImageView, AtSidebar }) => {
  const wWidth = 1200;
  const wHeight = 900;
  const wWidthSmall = 1000;

  const params = {
    config,
    data: { image: IMAGE },
  };

  I.amOnPage('/');
  I.resizeWindow(wWidthSmall, wHeight);

  LabelStudio.setFeatureFlags({
    'ff_front_dev_2394_zoomed_transforms_260522_short': true,
  });
  LabelStudio.init(params);
  AtImageView.waitForImage();
  AtSidebar.seeRegions(0);

  // Zoom in
  I.click('[aria-label=\'zoom-in\']');

  const canvasSizeSmall = await AtImageView.getCanvasSize();

  // Pan image to the left to see its right border
  I.pressKeyDown('Shift');
  AtImageView.drawByDrag(canvasSizeSmall.width - 10, canvasSizeSmall.height / 2, -canvasSizeSmall.width + 20, 0);
  I.pressKeyUp('Shift');

  // Create the region at the right border of the image
  AtImageView.drawByDrag(canvasSizeSmall.width - 30, canvasSizeSmall.height / 2 , 20, canvasSizeSmall.height / 2);
  AtSidebar.seeRegions(1);
  // Select this region
  AtImageView.clickAt(canvasSizeSmall.width - 20, canvasSizeSmall.height / 2 + 10);
  AtSidebar.seeSelectedRegion();

  I.resizeWindow(wWidth, wHeight);

  // If the canvas does not match the image, this action will rotate the region
  AtImageView.drawThroughPoints([[canvasSizeSmall.width - 20, canvasSizeSmall.height / 2 - 50], [canvasSizeSmall.width / 2, canvasSizeSmall.height / 2 - 50]],  'steps', 50);

  const results = await LabelStudio.serialize();

  // But we do not want to rotate it.
  assert.strictEqual(results[0].value.rotation, 0);
});