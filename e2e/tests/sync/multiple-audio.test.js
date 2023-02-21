/* global Feature, Scenario */

const assert = require('assert');

Feature('Sync: Multiple Audio');

const config = `
<View>
  <AudioPlus name="audio" value="$url" hotkey="space" sync="v1" />
  <AudioPlus name="audio2" value="$url" hotkey="space" sync="v1" />
</View>
`;

const data = {
  url: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3',
};

const annotations = [];

const params = {  annotations: [{ id: 'test', result: annotations }], config, data };

Scenario('Play/pause of multiple synced audio stay in sync', async function({ I, LabelStudio, AtAudioView }) {
  LabelStudio.setFeatureFlags({
    fflag_feat_front_dev_2461_audio_paragraphs_seek_chunk_position_short: true,
    ff_front_dev_2715_audio_3_280722_short: true,
  });

  I.amOnPage('/');

  LabelStudio.init(params);

  await AtAudioView.waitForAudio();

  I.waitForDetached('loading-progress-bar', 10);

  await AtAudioView.lookForStage();

  I.wait(10000);
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.equal(audioTime1, 0);
  }

  AtAudioView.clickPlayButton();
  I.wait(1);
  {
    const [{ paused: audioPaused1 }, { paused: audioPaused2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioPaused1, audioPaused2);
    assert.equal(audioPaused1, false);
  }

  I.wait(1);
  AtAudioView.clickPauseButton();
  I.wait(1);
  {
    const [{ currentTime: audioTime1, paused: audioPaused1 }, { currentTime: audioTime2, paused: audioPaused2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioPaused1, audioPaused2);
    assert.equal(audioPaused1, true);
    assert.equal(audioTime1, audioTime2);
    assert.notEqual(audioTime1, 0);
  }
});

Scenario('Seeking of multiple synced audio stay in sync', async function({ I, LabelStudio, AtAudioView }) {
  LabelStudio.setFeatureFlags({
    fflag_feat_front_dev_2461_audio_paragraphs_seek_chunk_position_short: true,
    ff_front_dev_2715_audio_3_280722_short: true,
  });

  I.amOnPage('/');

  LabelStudio.init(params);

  await AtAudioView.waitForAudio();

  I.waitForDetached('loading-progress-bar', 10);

  await AtAudioView.lookForStage();
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.equal(audioTime1, 0);
  }

  AtAudioView.clickAt(100);
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.notEqual(audioTime1, 0);
  }

  AtAudioView.clickAtBeginning();
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.equal(audioTime1, 0);
  }

  AtAudioView.clickAtEnd();
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2, duration }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.equal(audioTime1, duration);
  }

  AtAudioView.clickAt(300);
  {
    const [{ currentTime: audioTime1 }, { currentTime: audioTime2 }] = await AtAudioView.getCurrentAudio();

    assert.equal(audioTime1, audioTime2);
    assert.notEqual(audioTime1, 0);
  }
});
