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

const configSpeech = `
<View>
    <AudioPlus name="audio" value="$url"></AudioPlus>
    <Labels name="label" toName="audio">
      <Label value="Speech"/>
      <Label value="Noise" background="grey"/>
    </Labels>
    <TextArea name="transcription" toName="audio"
              perRegion="true" whenTagName="label" whenLabelValue="Speech"
              displayMode="region-list"/>
    <Choices name="sentiment" toName="audio" showInline="true"
             perRegion="true" whenTagName="label" whenLabelValue="Speech">
        <Choice value="Positive" html="&lt;span style='font-size: 45px; vertical-align: middle;'&gt; &#128512; &lt;/span&gt;"/>
        <Choice value="Neutral" html="&lt;span style='font-size: 45px; vertical-align: middle;'&gt; &#128528; &lt;/span&gt;"/>
        <Choice value="Negative" html="&lt;span style='font-size: 45px; vertical-align: middle;'&gt; &#128577; &lt;/span&gt;"/>
    </Choices>                               
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
const paramsSpeech = { annotations: [{ id: 'test', result: [] }], config: configSpeech, data };

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

Scenario('Check if there are ghost regions', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {
  LabelStudio.setFeatureFlags({
    ff_front_dev_2715_audio_3_280722_short: true,
  });
  I.amOnPage('/');

  LabelStudio.init(paramsSpeech);

  await AtAudioView.waitForAudio();

  I.waitForDetached('loading-progress-bar', 10);

  await AtAudioView.lookForStage();

  for (let i = 0; i < 20; i++) {
    // creating a new region
    I.pressKey('1');
    AtAudioView.dragAudioRegion((40 * i) + 10,30);
    AtAudioView.clickAt((40 * i) + 20);
    I.pressKey('2');
    I.pressKey('1');
    I.pressKey('u');
  }

  AtSidebar.seeRegions(20);

  for (let i = 0; i < 20; i++) {
    // creating a new region
    AtAudioView.clickAt((40 * i) + 20);
    AtSidebar.seeSelectedRegion();
    AtAudioView.dontSeeGhostRegion();
    I.pressKey('u');
  }

  AtSidebar.seeRegions(20);

  I.pressKey('u');

  AtSidebar.dontSeeSelectedRegion();
});

Scenario('Delete region by pressing delete hotkey', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {
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
  AtAudioView.dragAudioRegion(160,80);

  I.pressKey('Delete');

  I.pressKey('1');

  AtSidebar.seeRegions(1);
});
