
/* global Feature, Scenario */

Feature('Audio Errors');

const config = `
<View>
  <Header value="Select regions:"></Header>
  <Labels name="label" toName="audio" choice="multiple">
    <Label value="Beat" background="yellow"></Label>
    <Label value="Other"></Label>
  </Labels>
  <Header value="Listen the audio:"></Header>
  <AudioPlus name="audio" value="$url"></AudioPlus>
</View>
`;

const data = {
  url: '/files/opossum_intro.webm',
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

Scenario('Check if audio error handler is showing', async function({ I, LabelStudio, AtAudioView }) {
  LabelStudio.setFeatureFlags({
    ff_front_dev_2715_audio_3_280722_short: true,
  });
  I.amOnPage('/');

  LabelStudio.init(params);

  await AtAudioView.lookForStage();

  AtAudioView.seeErrorHandler('Error while loading audio');
});
