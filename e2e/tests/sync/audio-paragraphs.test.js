const assert = require('assert');
const { FFlagMatrix, FFlagScenario } = require('../../utils/feature-flags');

Feature('Sync: Audio Paragraphs');

const config = `
<View>
  <Audio name="audio" value="$url" hotkey="space" sync="text" />
  <Header value="Sentiment"/>
  <ParagraphLabels name="label" toName="text">
    <Label value="General: Positive" background="#00ff00"/>
    <Label value="General: Negative" background="#ff0000"/>
    <Label value="Company: Positive" background="#7dff7d"/>
    <Label value="Company: Negative" background="#ff7d7d"/>
    <Label value="External: Positive" background="#4bff4b"/>
    <Label value="External: Negative" background="#ff4b4b"/>
  </ParagraphLabels>
  <View style="height: 400px; overflow-y: auto">
    <Header value="Transcript"/>
    <Paragraphs audioUrl="$url" sync="audio" name="text" value="$text" layout="dialogue" textKey="text" nameKey="author" showplayer="true" />
  </View>
</View>
`;

const data = {
  url: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3',
  text: [
    {
      'end': 2,
      'text': 'Dont you hate that?',
      'start': 0,
      'author': 'Mia Wallace',
    },
    {
      'text': 'Hate what?',
      'start': 2,
      'author': 'Vincent Vega:',
      'duration': 2,
    },
    {
      'text': 'Uncomfortable silences. Why do we feel its necessary to yak about bullshit in order to be comfortable?',
      'author': 'Mia Wallace:',
      'start': 4,
      'end': 6,
    },
    {
      'text': 'I dont know. Thats a good question.',
      'start': 6,
      'end': 8,
      'author': 'Vincent Vega:',
    },
    {
      'text': 'Thats when you know you found somebody really special. When you can just shut the fuck up for a minute, and comfortably share silence.',
      'author': 'Mia Wallace:',
      'start': 8,
    },
  ],
};

const annotations = [
  {
    'value': {
      'start': '0',
      'end': '0',
      'startOffset': 0,
      'endOffset': 4,
      'text': 'Dont',
      'paragraphlabels': [
        'General: Negative',
      ],
    },
    'id': 'RcHv5CdYBt',
    'from_name': 'label',
    'to_name': 'text',
    'type': 'paragraphlabels',
    'origin': 'manual',
  },
  {
    'value': {
      'start': '0',
      'end': '0',
      'startOffset': 9,
      'endOffset': 13,
      'text': 'hate',
      'paragraphlabels': [
        'General: Positive',
      ],
    },
    'id': 'eePG7PVYH7',
    'from_name': 'label',
    'to_name': 'text',
    'type': 'paragraphlabels',
    'origin': 'manual',
  },
];

const params = {  annotations: [{ id: 'test', result: annotations }], config, data };

FFlagMatrix(['fflag_feat_front_lsdv_e_278_contextual_scrolling_short'], function(flags) {
  FFlagScenario('Audio clip is played when selecting the play button next to a paragraph segment', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {
    LabelStudio.setFeatureFlags({
      ff_front_dev_2715_audio_3_280722_short: true,
      ...flags,
    });

    I.amOnPage('/');

    LabelStudio.init(params);

    await AtAudioView.waitForAudio();
    await AtAudioView.lookForStage();

    AtSidebar.seeRegions(2);

    const [{ currentTime: startingAudioTime }, { currentTime: startingParagraphAudioTime }] = await AtAudioView.getCurrentAudio();

    assert.equal(startingAudioTime, startingParagraphAudioTime);
    assert.equal(startingParagraphAudioTime, 0);

    I.click('[aria-label="play-circle"]');
    I.wait(1);

    I.click('[aria-label="pause-circle"]');
    I.wait(1);

    const [{ currentTime: seekAudioTime }, { currentTime: seekParagraphAudioTime }] = await AtAudioView.getCurrentAudio();

    assert.notEqual(seekAudioTime, 0);
    I.assertTimesInSync(seekAudioTime, seekParagraphAudioTime, `Expected seek time to be ${seekAudioTime} but was ${seekParagraphAudioTime}`);
  });

  if (flags['fflag_feat_front_lsdv_e_278_contextual_scrolling_short']) {
    FFlagScenario('Playback button states continually change over time according to the paragraph segment which is being played', async function({ I, LabelStudio, AtAudioView, AtSidebar }) {

      LabelStudio.setFeatureFlags({
        ff_front_dev_2715_audio_3_280722_short: true,
        ...flags,
      });

      I.amOnPage('/');

      LabelStudio.init(params);

      await AtAudioView.waitForAudio();
      await AtAudioView.lookForStage();

      AtSidebar.seeRegions(2);

      const [{ currentTime: startingAudioTime }, { currentTime: startingParagraphAudioTime }] = await AtAudioView.getCurrentAudio();

      assert.equal(startingAudioTime, startingParagraphAudioTime);
      assert.equal(startingParagraphAudioTime, 0);

      AtAudioView.clickPauseButton();

      // Plays the first paragraph segment when the audio interface is played
      I.seeElement('[data-testid="phrase:0"] [aria-label="pause-circle"]');
      I.seeElement('[data-testid="phrase:1"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:2"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:3"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:4"] [aria-label="play-circle"]');

      I.wait(2);

      // Plays the second paragraph segment when the audio progresses to the second paragraph segment
      I.seeElement('[data-testid="phrase:1"] [aria-label="pause-circle"]');
      I.seeElement('[data-testid="phrase:0"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:2"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:3"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:4"] [aria-label="play-circle"]');

      I.wait(2);

      // Plays the third paragraph segment when the audio progresses to the third paragraph segment
      I.seeElement('[data-testid="phrase:2"] [aria-label="pause-circle"]');
      I.seeElement('[data-testid="phrase:0"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:1"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:3"] [aria-label="play-circle"]');
      I.seeElement('[data-testid="phrase:4"] [aria-label="play-circle"]');
    });
  }
});
