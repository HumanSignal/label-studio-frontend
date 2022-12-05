const assert = require('assert');

Feature('Readonly');

const imageExamples = new DataTable(['example', 'regionName']);

imageExamples.add([require('../../../examples/image-bboxes'), 'Hello']);
imageExamples.add([require('../../../examples/image-ellipses'), 'Hello']);
imageExamples.add([require('../../../examples/image-keypoints'), 'Hello']);
imageExamples.add([require('../../../examples/image-polygons'), 'Hello']);

Data(imageExamples).Scenario('Readonly Image Annotations', async ({
  I,
  current,
  LabelStudio,
  AtSidebar,
  AtImageView,
}) => {
  I.amOnPage('/');
  const { config, result, data } = current.example;
  const regions = result.filter(r => {
    return r.type.match('labels');
  });

  const params = {
    annotations: [{
      id: 'test',
      readonly: true, // Mark annotation readonly
      result,
    }],
    config,
    data,
  };

  LabelStudio.init(params);

  await AtImageView.waitForImage();
  I.say(`Running against ${current.example.title}`);
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
    x: regionCenter.x + 50,
    y: regionCenter.y + 50,
  });
  I.say('Results are equal after modification attempt');
  console.log({
    regions,
    lsf: await LabelStudio.serialize(),
  });
  AtSidebar.seeRegions(regions.length);
  await LabelStudio.resultsNotChanged(result, 1);

  I.pressKey('Delete');
  I.say('Results are equal after deletion attempt');
  await LabelStudio.resultsNotChanged(result, 1);

  I.say('Can\'t draw new shape');
  I.pressKey('1');

  switch(current.example.title) {
    case 'Keypoints on Image':
      AtImageView.clickAt(100, 100);
      break;
    case 'Polygons on Image':
      AtImageView.drawThroughPoints([
        [100, 100],
        [150, 150],
        [150, 200],
        [100, 100],
      ]);
      break;
    default:
      AtImageView.drawByDrag(100, 100, 150, 150);
      break;
  }

  AtSidebar.seeRegions(regions.length);
});
