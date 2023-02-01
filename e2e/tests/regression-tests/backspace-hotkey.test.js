/* global Feature, Scenario */

Feature('Backspace hotkey').tag('@regress');

const AUDIO_URL = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3';

Scenario('Check if regions is selected', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {
  const params = {
    annotations: [{ id: 'test', result: [] }],
    config: `<View>
  <Labels name="label" toName="audio" zoom="true" hotkey="ctrl+enter">
    <Label value="Speaker one" background="#00FF00"/>
    <Label value="Speaker two" background="#12ad59"/>
  </Labels>
  <Audio name="audio" value="$audio" />
</View>`,
    data: {
      audio: AUDIO_URL,
    },
  };

  LabelStudio.setFeatureFlags({
    ff_front_dev_2715_audio_3_280722_short: true,
  });
  I.amOnPage('/');

  I.say('Init LabelStudio');

  LabelStudio.init(params);
  await AtAudioView.waitForAudio();

  I.say('Re-init LabelStudio');

  LabelStudio.init(params);
  await AtAudioView.waitForAudio();

  AtSidebar.seeRegions(0);

  I.say('Draw region');

  await AtAudioView.lookForStage();
  I.pressKey('1');
  AtAudioView.dragAudioRegion(50, 200);
  I.pressKey('u');
  AtSidebar.seeRegions(1);

  I.say('Try to delete it by backspace hotkey');
  AtAudioView.clickAt(150);
  I.pressKey('Backspace');
  AtSidebar.seeRegions(0);

  I.say('Draw a couple of regions');

  for (let k = 0; k < 5; k++) {
    I.pressKey('1');
    AtAudioView.dragAudioRegion(50 + 50 * k, 30);
    I.pressKey('u');
  }
  AtSidebar.seeRegions(5);

  I.say('Try to delete all regions by ctrl+backspace hotkey');

  I.pressKey(['CommandOrControl', 'Backspace']);
  I.acceptPopup();

  AtSidebar.seeRegions(0);
});

