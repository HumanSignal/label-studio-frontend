/* global Feature, Scenario, locate */

const assert = require("assert");

Feature("Audio Paragraphs");

const config = `
<View>
  <AudioPlus name="audio" value="$url" hotkey="space" sync="text" />
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
  url: "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3",
  text: [
    {
      "end": 5.6,
      "text": "Dont you hate that?",
      "start": 3.1,
      "author": "Mia Wallace",
    },
    {
      "text": "Hate what?",
      "start": 4.2,
      "author": "Vincent Vega:",
      "duration": 3.1,
    },
    {
      "text": "Uncomfortable silences. Why do we feel its necessary to yak about bullshit in order to be comfortable?",
      "author": "Mia Wallace:",
    },
    {
      "text": "I dont know. Thats a good question.",
      "start": 90,
      "author": "Vincent Vega:",
    },
    {
      "text": "Thats when you know you found somebody really special. When you can just shut the fuck up for a minute, and comfortably share silence.",
      "author": "Mia Wallace:",
    },
  ],
};

const annotations = [
  {
    "value": {
      "start": "0",
      "end": "0",
      "startOffset": 0,
      "endOffset": 4,
      "text": "Dont",
      "paragraphlabels": [
        "General: Negative",
      ],
    },
    "id": "RcHv5CdYBt",
    "from_name": "label",
    "to_name": "text",
    "type": "paragraphlabels",
    "origin": "manual",
  },
  {
    "value": {
      "start": "0",
      "end": "0",
      "startOffset": 9,
      "endOffset": 13,
      "text": "hate",
      "paragraphlabels": [
        "General: Positive",
      ],
    },
    "id": "eePG7PVYH7",
    "from_name": "label",
    "to_name": "text",
    "type": "paragraphlabels",
    "origin": "manual",
  },
];

const params = {  annotations: [{ id: "test", result: annotations }], config, data };

Scenario("Check audio clip is played when using the new sync option", async function({ I, LabelStudio, AtAudioView }) {

  I.amOnPage("/");

  const hasFFDev1713 = await LabelStudio.hasFF("ff_front_DEV_1713_audio_ui_150222_short");
  const hasFFDev2461 = await LabelStudio.hasFF("fflag_feat_front_dev_2461_audio_paragraphs_seek_chunk_position_short");

  if  (!hasFFDev1713) {
    return;
  }

  LabelStudio.init(params);

  await AtAudioView.waitForAudio();

  I.wait(1);

  const [startingAudioPlusTime, startingParagraphAudioTime] = await AtAudioView.getCurrentAudioTime();

  if (hasFFDev2461) {
    assert.equal(startingAudioPlusTime, startingParagraphAudioTime);
    assert.equal(startingParagraphAudioTime, 0);
  }

  I.click(`[aria-label="play-circle"]`);

  I.click(`[aria-label="pause-circle"]`);

  const [seekAudioPlusTime, seekParagraphAudioTime] = await AtAudioView.getCurrentAudioTime();

  const expectedSeekTime = Math.round(seekAudioPlusTime);

  if (hasFFDev2461) {
    assert.equal(expectedSeekTime, Math.round(seekParagraphAudioTime), `Expected seek time to be ${expectedSeekTime} but was ${Math.round(seekParagraphAudioTime)}`);
  } else {
    assert(expectedSeekTime > 0, "Expected seek time to be greater than 0");
  }
});

