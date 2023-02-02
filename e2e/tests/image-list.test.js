/* global Feature, Scenario */

const { initLabelStudio } = require('./helpers');

Feature('Image list via `valueList`');

const config = `
  <View>
    <Image name="img" valueList="$images"/>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
`;

const data = {
  images: [
    'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg',
    'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/alexander-andrews-astro-alex-visuals-0Z1Z2Z0Z0Z0-unsplash.jpg',
    'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/alexander-andrews-astro-alex-visuals-0Z1Z2Z0Z0Z0-unsplash.jpg',
  ],
};

Scenario('Image list rendering', async ({ I, LabelStudio, AtImageView }) => {
  LabelStudio.setFeatureFlags({
    feat_front_lsdv_4583_multi_image_segmentation_short: true,
  });

  const params = {
    config,
    data,
    annotations: [{ id: 1, result: [] }],
  };

  I.amOnPage('/');
  I.executeScript(initLabelStudio, params);

  await AtImageView.waitForImage();
  await AtImageView.lookForStage();

  I.seeElement(`img[src="${data.images[0]}"]`);
});
