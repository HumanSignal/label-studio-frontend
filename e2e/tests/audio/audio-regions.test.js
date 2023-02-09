/* global Feature, Scenario */

Feature('Audio Regions');

const config = `
<View>
  <Header value="Select regions:"></Header>
  <Labels name="label" toName="audio" choice="multiple">
    <Label value="Beat" background="yellow"></Label>
    <Label value="Voice" background="red"></Label>
    <Label value="Guitar" background="blue"></Label>
    <Label value="Other"></Label>
  </Labels>
  <Header value="Select genre:"></Header>
  <Choices name="choice" toName="audio" choice="multiple">
    <Choice value="Lo-Fi" />
    <Choice value="Rock" />
    <Choice value="Pop" />
  </Choices>
  <Header value="Listen the audio:"></Header>
  <AudioPlus name="audio" value="$url"></AudioPlus>
</View>
`;

const data = {
  url: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3',
};

const annotations = [
  {
    from_name: 'choice',
    id: 'hIj6zg57SY',
    to_name: 'audio',
    type: 'choices',
    origin: 'manual',
    value: {
      choices: ['Lo-Fi'],
    },
  },
  {
    from_name: 'label',
    id: 'JhxupEJWlW',
    to_name: 'audio',
    original_length: 98.719925,
    type: 'labels',
    origin: 'manual',
    value: {
      channel: 1,
      end: 59.39854733358493,
      labels: ['Other'],
      start: 55.747572792986325,
    },
  },
];

const params = { annotations: [{ id: 'test', result: annotations }], config, data };

Scenario('Check if regions are selected', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {
  LabelStudio.setFeatureFlags({
    ff_front_dev_2715_audio_3_280722_short: true,
  });
  I.amOnPage('/');

  LabelStudio.init(params);

  await AtAudioView.waitForAudio();

  I.waitForDetached('loading-progress-bar', 10);

  await AtAudioView.lookForStage();

  AtSidebar.seeRegions(1);

  // creating a new region
  I.pressKey('1');
  AtAudioView.dragAudioRegion(160,80);
  I.pressKey('u');

  AtSidebar.seeRegions(2);

  AtAudioView.clickAt(170);
  AtSidebar.seeSelectedRegion();
  AtAudioView.clickAt(170);
  AtSidebar.dontSeeSelectedRegion();
  AtAudioView.dragAudioRegion(170,40);
  AtSidebar.seeSelectedRegion();
  AtAudioView.clickAt(220);
  AtSidebar.dontSeeSelectedRegion();
});
