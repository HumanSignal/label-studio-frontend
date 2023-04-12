const { initLabelStudio, serialize, waitForImage } = require('./helpers');

const assert = require('assert');

Feature('Test Image object');

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
  id: 'Dx_aB91ISN',
  source: '$image',
  from_name,
  to_name: 'img',
  type,
  origin: 'manual',
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
  id: '1001',
  lead_time: 15.053,
  result: [createRegion('tag', 'rectanglelabels', { rectanglelabels: ['Moonwalker'] })],
};

// perregion regions have the same id as main region
// and their own data (`text` in this case)
const annotationWithPerRegion = {
  id: '1002',
  result: [annotationMoonwalker.result[0], createRegion('answer', 'textarea', { text: ['blah'] })],
};

const image =
  'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg';

Scenario('Check Rect region for Image', async function({ I, AtImageView, AtSidebar }) {
  const params = {
    config,
    data: { image },
    annotations: [annotationMoonwalker],
  };

  I.amOnPage('/');
  I.executeScript(initLabelStudio, params);

  AtImageView.waitForImage();
  await AtImageView.lookForStage();
  I.executeScript(waitForImage);
  AtSidebar.seeRegions(1);
  // select first and only region
  I.click(locate('[aria-label="region"]'));
  I.see('Labels:');

  // click on region's rect on the canvas
  AtImageView.clickAt(330, 80);
  I.wait(1);
  I.dontSee('Labels:');
});

Scenario('Image with perRegion tags', async function({ I, AtImageView, AtSidebar }) {
  let result;
  const params = {
    config: perRegionConfig,
    data: { image },
    annotations: [annotationWithPerRegion],
  };

  I.amOnPage('/');
  I.executeScript(initLabelStudio, params);


  AtImageView.waitForImage();
  I.executeScript(waitForImage);
  AtSidebar.seeRegions(1);
  // select first and only region
  I.click(locate('[aria-label="region"]'));
  I.see('Labels:');

  // check that there is deserialized text for this region; and without doubles
  I.seeNumberOfElements(locate('mark').withText('blah'), 1);

  // add another note via textarea
  I.fillField('[name=answer]', 'another');
  I.pressKey('Enter');
  // texts are concatenated in the regions list (now with \n, so check separately)
  I.seeNumberOfElements(locate('mark').withText('blah'), 1);
  I.seeNumberOfElements(locate('mark').withText('another'), 1);
  // and there is only one tag with all these texts
  I.seeNumberOfElements('mark', 1);

  // serialize with two textarea regions
  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, 'Dx_aB91ISN');
  assert.strictEqual(result[1].id, 'Dx_aB91ISN');
  assert.deepStrictEqual(result[0].value.rectanglelabels, ['Moonwalker']);
  assert.deepStrictEqual(result[1].value.text, ['blah', 'another']);

  // delete first deserialized text and check that only "another" left
  I.click(locate('[aria-label="Delete Region"]').inside('[data-testid="textarea-region"]'));
  I.dontSeeElement(locate('mark').withText('blah'));
  I.seeElement(locate('mark').withText('another'));

  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 2);
  assert.deepStrictEqual(result[0].value.rectanglelabels, ['Moonwalker']);
  assert.deepStrictEqual(result[1].value.text, ['another']);

  // delete also "another" region
  I.click(locate('[aria-label="Delete Region"]').inside('[data-testid="textarea-region"]'));
  // there are should be no texts left at all
  I.dontSeeElement(locate('mark'));

  result = await I.executeScript(serialize);
  assert.strictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].value.rectanglelabels, ['Moonwalker']);
});

Scenario('Can\'t create region outside of canvas', async ({ I, AtLabels, AtSidebar, AtImageView, LabelStudio }) => {
  const cfg = `
<View>
  <Image name="img" value="$image"></Image>
  <RectangleLabels name="tag" toName="img" fillOpacity="0.5" strokeWidth="5">
    <Label value="Planet"></Label>
    <Label value="Moonwalker" background="blue"></Label>
  </RectangleLabels>
</View>
`;

  I.amOnPage('/');

  LabelStudio.setFeatureFlags({
    fflag_fix_front_dev_3793_relative_coords_short: true,
  });

  I.executeScript(() => {
    window.LabelStudio.destroyAll();
  });

  LabelStudio.init({
    config: cfg,
    data: { image },
    task: {
      id: 0,
      annotations: [{ id: 1001, result: [] }],
      predictions: [],
    },
  });

  await AtImageView.lookForStage();
  await AtImageView.waitForImage();

  const stage = AtImageView.stageBBox();

  I.say('Drawing region in the upper left corner');
  AtLabels.clickLabel('Planet');
  AtImageView.drawByDrag(100, 100, -200, -200);

  I.say('Drawing region in the upper right corner');
  AtLabels.clickLabel('Planet');
  AtImageView.drawByDrag(stage.width - 100, 100, stage.width + 100, -100);

  I.say('Drawing region in the bottom left corner');
  AtLabels.clickLabel('Planet');
  AtImageView.drawByDrag(100, stage.height - 100, -100, stage.height + 100);

  I.say('Drawing region in the bottom right corner');
  AtLabels.clickLabel('Planet');
  AtImageView.drawByDrag(stage.width - 100, stage.height - 100, stage.width + 100, stage.height + 100);

  AtSidebar.seeRegions(4);

  const result = await LabelStudio.serialize();

  const [r1, r2, r3, r4] = result.map(r => r.value);

  I.say('First region should be in the corner');
  assert.strictEqual(r1.x, 0);
  assert.equal(r1.y, 0);

  I.say('Second region should be in the corner');
  assert.equal(Math.round(r2.x + r2.width), 100);
  assert.equal(r2.y, 0);

  I.say('Third region should be in the corner');
  assert.equal(r3.x, 0);
  assert.equal(Math.round(r3.y + r3.height), 100);

  I.say('Fourth region should be in the corner');
  assert.equal(Math.round(r4.x + r4.width), 100);
  assert.equal(Math.round(r4.y + r4.height), 100);
});
