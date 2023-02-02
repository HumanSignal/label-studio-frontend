/* global Feature, Scenario, locate */

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
    'https://data.heartex.net/open-images/train_0/mini/00133643bbf063a9.jpg',
    'https://data.heartex.net/open-images/train_0/mini/00155094b7acc33b.jpg',
    'https://data.heartex.net/open-images/train_0/mini/000e842c55ab7d14.jpg',
    'https://data.heartex.net/open-images/train_0/mini/00766c7816e51125.jpg',
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

Scenario('Image list with page navigation', async ({ I, LabelStudio, AtImageView }) => {
  LabelStudio.setFeatureFlags({
    feat_front_lsdv_4583_multi_image_segmentation_short: true,
  });

  const params = {
    config,
    data,
    annotations: [{ id: 1, result: [] }],
  };

  const prevPageButton = locate('.lsf-pagination__btn.lsf-pagination__btn_arrow-left');
  const nextPageButton = locate('.lsf-pagination__btn.lsf-pagination__btn_arrow-right');

  I.amOnPage('/');
  I.executeScript(initLabelStudio, params);

  await AtImageView.waitForImage();
  await AtImageView.lookForStage();

  I.say('Loading first image');
  I.seeElement(`img[src="${data.images[0]}"]`);

  I.say('Pagination is visible');
  I.seeElement('.lsf-pagination');

  I.say('The number of pages is correct');
  I.see('1 of 4');

  I.say('Clicking on the next page');
  I.click(nextPageButton);

  I.say('Loading second image');
  I.seeElement(`img[src="${data.images[1]}"]`);
  I.see('2 of 4');

  I.say('Clicking on the previous page');
  I.click(prevPageButton);
  I.seeElement(`img[src="${data.images[0]}"]`);
  I.see('1 of 4');
});

Scenario('Image list with hotkey navigation', async ({ I, LabelStudio, AtImageView }) => {
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

  I.say('Loading first image');
  I.seeElement(`img[src="${data.images[0]}"]`);

  I.say('Pagination is visible');
  I.seeElement('.lsf-pagination');

  I.say('The number of pages is correct');
  I.see('1 of 4');

  I.say('Clicking on the next page');
  I.pressKey('Ctrl+]');

  I.say('Loading second image');
  I.seeElement(`img[src="${data.images[1]}"]`);
  I.see('2 of 4');

  I.say('Clicking on the previous page');
  I.pressKey('Ctrl+[');
  I.seeElement(`img[src="${data.images[0]}"]`);
  I.see('1 of 4');
});
