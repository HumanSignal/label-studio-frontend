const assert = require('assert');

Feature('Readonly');

Scenario('Readonly Annotations', async ({ I, LabelStudio, AtSidebar, AtImageView }) => {
  I.amOnPage('/');
  const { config, result, data } = require('../../examples/image-ellipses');

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
  AtSidebar.seeRegions(result.length);
  AtSidebar.clickRegion('Moonwalker');

  I.say('No tranformer available');
  const isTransformerExist = await AtImageView.isTransformerExist();

  assert.equal(isTransformerExist, false);

  const regionId = result[0].id;
  const regionCenter = await AtImageView.getRegionCenterPosition(regionId);

  I.say('Checking region is not changed by dragging');
  await I.dragAndDropMouse(regionCenter, {
    x: regionCenter.x + 100,
    y: regionCenter.y + 100,
  });

  I.say('Results are equal');
  const serialized = (await LabelStudio.serialize())[0];

  assert.deepEqual(result[0], serialized);
});
