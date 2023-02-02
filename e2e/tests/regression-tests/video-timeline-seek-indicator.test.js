/* global Feature, Scenario */

const assert = require('assert');

Feature('Video timeline seek indicator').tag('@regress');


Scenario('Seek view should be in sync with indicator position', async ({ I, LabelStudio, AtVideoView }) => {
  I.amOnPage('/');
  LabelStudio.init({
    config: `
<View>
  <Video name="video" value="$video" />
  <VideoRectangle name="box" toName="video" />

  <Labels name="videoLabels" toName="video">
    <Label value="Car" background="#944BFF"/>
    <Label value="Airplane" background="#98C84E"/>
    <Label value="Possum" background="#FA8C16"/>
  </Labels>
</View>`,
    data: { video: '/files/opossum_intro.webm' },
  });

  I.say('waitForObjectsReady');
  LabelStudio.waitForObjectsReady();

  const trackBbox = await AtVideoView.grabTrackBoundingRect();
  let positionBbox = await AtVideoView.grabPositionBoundingRect();
  let indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

  assert.notDeepEqual({ x: 0, y: 0, width: 0, height: 0 }, trackBbox);
  assert.notDeepEqual({ x: 0, y: 0, width: 0, height: 0 }, positionBbox);
  assert.notDeepEqual({ x: 0, y: 0, width: 0, height: 0 }, indicatorBbox);

  const trackZeroX = trackBbox.x;
  const halfway = (trackBbox.width - trackZeroX) / 2;

  {
    I.say('Drag the video position indicator to the right to the middle');

    AtVideoView.drag(positionBbox, halfway, 0);
    positionBbox = await AtVideoView.grabPositionBoundingRect();
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Check the video position indicator is close to 50%');
    const delta = Math.round((positionBbox.x / (trackBbox.x + trackBbox.width)) * 10) / 10;

    assert.equal(0.5, delta);

    I.say('Check the video position indicator is within the seek indicator');
    assert.ok(indicatorBbox.x <= positionBbox.x);
    assert.ok(indicatorBbox.x + indicatorBbox.width >= positionBbox.x + positionBbox.width);
  }

  {
    I.say('Drag the video position indicator to the end');
    AtVideoView.drag(positionBbox, trackBbox.width, 0);
    positionBbox = await AtVideoView.grabPositionBoundingRect();
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Check the video position indicator is close to 100%');
    const delta = Math.round((positionBbox.x / (trackBbox.x + trackBbox.width)) * 10) / 10;

    assert.equal(1, delta);

    I.say('Check the video position indicator is within the seek indicator');
    assert.ok(indicatorBbox.x <= positionBbox.x);
    assert.ok(indicatorBbox.x + indicatorBbox.width >= positionBbox.x + positionBbox.width);
  }

  {
    I.say('Drag the video position indicator to the left to the middle');
    AtVideoView.drag(positionBbox, halfway, 0);
    positionBbox = await AtVideoView.grabPositionBoundingRect();
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Check the video position indicator is close to 50%');
    const delta = Math.round((positionBbox.x / (trackBbox.x + trackBbox.width)) * 10) / 10;

    assert.equal(0.5, delta);

    I.say('Check the video position indicator is within the seek indicator');
    assert.ok(indicatorBbox.x <= positionBbox.x);
    assert.ok(indicatorBbox.x + indicatorBbox.width >= positionBbox.x + positionBbox.width);
  }
  
  {
    I.say('Drag the video position indicator to the start');
    AtVideoView.drag(positionBbox, 0, 0);
    positionBbox = await AtVideoView.grabPositionBoundingRect();
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Check the video position indicator is close to 0%');
    const delta = Math.round((positionBbox.x / (trackBbox.x + trackBbox.width)) * 10) / 10;

    assert.equal(0, delta);

    I.say('Check the video position indicator is within the seek indicator');
    assert.ok(indicatorBbox.x <= positionBbox.x);
    assert.ok(indicatorBbox.x + indicatorBbox.width >= positionBbox.x + positionBbox.width);
  }

  {
    I.say('Click on the seek step forward button until the video position indicator is at the end');
    let indicatorPosX = indicatorBbox.x;

    I.say('Move the video position indicator to the end of the seek indicator');
    await AtVideoView.drag(positionBbox, indicatorBbox.width, 0);
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Seeker should not have moved');
    assert.equal(indicatorBbox.x, indicatorPosX);
    indicatorPosX = indicatorBbox.x;

    I.say('Click on the seek step forward button');
    await AtVideoView.clickSeekStepForward(1);
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Seeker should now have moved to the right');
    assert.ok(indicatorBbox.x > indicatorPosX);
    indicatorPosX = indicatorBbox.x;

    I.say('Click on the seek step backward button');
    await AtVideoView.clickSeekStepBackward(1);
    indicatorBbox = await AtVideoView.grabIndicatorBoundingRect();

    I.say('Seeker should now have moved to the left');
    assert.ok(indicatorBbox.x < indicatorPosX);
  }
});

