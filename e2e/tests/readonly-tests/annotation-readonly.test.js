const assert = require('assert');
const Asserts = require('../../utils/asserts');

Feature('Readonly');

const imageExamples = new DataTable(['requreUrl', 'regionName']);

imageExamples.add(['../../examples/image-bboxes', 'Hello']);
imageExamples.add(['../../examples/image-ellipses', 'Hello']);
imageExamples.add(['../../examples/image-keypoints', 'Hello']);
imageExamples.add(['../../examples/image-polygons', 'Hello']);

Data(imageExamples).Scenario('Readonly Annotations', async ({
  I,
  current,
  LabelStudio,
  AtSidebar,
  AtImageView,
}) => {
  I.amOnPage('/');
  const { config, result, data } = require(current.requreUrl);
  const regions = result.filter(r => {
    return r.type.match('labels');
  });

  const params = {
    annotations: [{
      id: 'test',
      readonly: true,
      result,
    }],
    config,
    data,
  };

  LabelStudio.init(params);

  await AtImageView.waitForImage();

  I.see('Update', { css: 'button[disabled]' });

  I.say('Check region is selectable');
  AtSidebar.seeRegions(regions.length);
  AtSidebar.clickRegion(current.regionName);

  I.say('No tranformer available');
  const isTransformerExist = await AtImageView.isTransformerExist();

  assert.equal(isTransformerExist, false);

  const regionId = regions[0].id;

  I.say(`Looking for a region #${regionId}`);
  const regionCenter = await AtImageView.getRegionCenterPosition(regionId);

  I.say('Checking region is not changed by dragging');
  await I.dragAndDropMouse(regionCenter, {
    x: regionCenter.x + 100,
    y: regionCenter.y + 100,
  });

  I.say('Results are equal');
  const serialized = (await LabelStudio.serialize())[0];

  Asserts.deepEqualWithTolerance(result[0], serialized, 1);

  I.say('Can\'t draw new shape');
  I.pressKey('1');

  if (current.requreUrl.match('keypoints')) {
    AtImageView.clickAt(100, 100);
  } else if (current.requreUrl.match('polygons')) {
    AtImageView.drawThroughPoints([
      [100, 100],
      [150, 150],
      [150, 200],
      [100, 100],
    ]);
  } else {
    AtImageView.drawByDrag(100, 100, 150, 150);
  }

  AtSidebar.seeRegions(regions.length);
});
