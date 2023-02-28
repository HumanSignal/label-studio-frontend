const assert = require('assert');
const { omitBy } = require('./helpers');

Feature('Paragraphs filter');

const AUDIO = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3';

const DATA = {
  audio: AUDIO,
  dialogue: [
    {
      start: 3.1,
      end: 5.6,
      author: 'Mia Wallace',
      text: 'Dont you hate that?',
    },
    {
      start: 4.2,
      duration: 3.1,
      author: 'Vincent Vega:',
      text: 'Hate what?',
    },
    {
      author: 'Mia Wallace:',
      text: 'Uncomfortable silences. Why do we feel its necessary to yak about bullshit in order to be comfortable?',
    },
    {
      start: 90,
      author: 'Vincent Vega:',
      text: 'I dont know. Thats a good question.',
    },
    {
      author: 'Mia Wallace:',
      text:
        'Thats when you know you found somebody really special. When you can just shut the fuck up for a minute, and comfortably share silence.',
    },
  ],
};
const CONFIG = `
<View>
  <ParagraphLabels name="ner" toName="text">
    <Label value="Important Stuff"></Label>
    <Label value="Random talk"></Label>
  </ParagraphLabels>
  <Paragraphs audioUrl="$audio" name="text" value="$dialogue" layout="dialogue" savetextresult="yes" />
</View>`;

const FEATURE_FLAGS = {
  ff_front_dev_2669_paragraph_author_filter_210622_short: true,
  fflag_fix_front_dev_2918_labeling_filtered_paragraphs_250822_short: true,
};

Scenario('Create two results using excluding a phrase  by the filter', async ({ I, LabelStudio, AtSidebar, AtParagraphs, AtLabels }) => {
  const params = {
    data: DATA,
    config: CONFIG,
  };

  I.amOnPage('/');

  LabelStudio.setFeatureFlags(FEATURE_FLAGS);
  LabelStudio.init(params);
  AtSidebar.seeRegions(0);

  I.say('Select 2 regions in the consecutive phrases of the one person');

  AtLabels.clickLabel('Random talk');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('Hate what?'),
    5,
    AtParagraphs.locateText('Hate what?'),
    10,
  );

  AtLabels.clickLabel('Random talk');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('I dont know. Thats a good question.'),
    0,
    AtParagraphs.locateText('I dont know. Thats a good question.'),
    11,
  );
  AtSidebar.seeRegions(2);

  I.say('Take a snapshot');
  const twoActionsResult = LabelStudio.serialize();

  I.say('Reset to initial state');
  LabelStudio.init(params);
  AtSidebar.seeRegions(0);

  I.say('Filter the phrases by that person.');
  AtParagraphs.clickFilter('Vincent Vega:');

  I.say('Try to get the same result in one action');

  AtLabels.clickLabel('Random talk');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('Hate what?'),
    5,
    AtParagraphs.locateText('I dont know. Thats a good question.'),
    11,
  );
  AtSidebar.seeRegions(2);

  I.say('Take a second snapshot');
  const oneActionResult = LabelStudio.serialize();

  I.say('The results should be identical');

  assert.deepStrictEqual(twoActionsResult, oneActionResult);

});

Scenario('Check different cases ', async ({ I, LabelStudio, AtSidebar, AtParagraphs, AtLabels }) => {
  const dialogue = [
    1,// 1
    3,// 2
    1,// 3
    2,// 4
    3,// 5
    1,// 6
    2,// 7
    1,// 8
    3,// 9
    1,// 10
  ].map((authorId, idx)=>({
    start: idx+1,
    end: idx+2,
    author: `Author ${authorId}`,
    text: `Message ${idx+1}`,
  }));
  const params = {
    config: CONFIG,
    data: {
      audio: AUDIO,
      dialogue,
    },
  };

  I.amOnPage('/');

  LabelStudio.setFeatureFlags(FEATURE_FLAGS);
  LabelStudio.init(params);
  AtSidebar.seeRegions(0);

  I.say('Hide Author 3');
  AtParagraphs.clickFilter('Author 1', 'Author 2');

  I.say('Make regions by selecting everything');
  AtLabels.clickLabel('Random talk');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('Message 1'),
    0,
    AtParagraphs.locateText('Message 10'),
    10,
  );

  I.say('There should be 4 new regions');
  AtSidebar.seeRegions(4);
  {
    const result = await LabelStudio.serialize();

    assert.strictEqual(result.length, 4);

    assert.deepStrictEqual(omitBy(result[0].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '0',
      'end': '0',
      'startOffset': 0,
      'endOffset': 9,
      'text': 'Message 1',
    });

    assert.deepStrictEqual(omitBy(result[1].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '2',
      'end': '3',
      'startOffset': 0,
      'endOffset': 9,
      'text': 'Message 3\n\nMessage 4',
    });

    assert.deepStrictEqual(omitBy(result[2].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '5',
      'end': '7',
      'startOffset': 0,
      'endOffset': 9,
      'text': 'Message 6\n\nMessage 7\n\nMessage 8',
    });

    assert.deepStrictEqual(omitBy(result[3].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '9',
      'end': '9',
      'startOffset': 0,
      'endOffset': 10,
      'text': 'Message 10',
    });
  }

  I.say('Test the overlaps of regions #1');
  AtLabels.clickLabel('Important Stuff');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('Message 3'),
    4,
    AtParagraphs.locateText('Message 8'),
    4,
  );
  AtSidebar.seeRegions(6);

  {
    const result = await LabelStudio.serialize();

    assert.deepStrictEqual(omitBy(result[4].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '2',
      'end': '3',
      'startOffset': 4,
      'endOffset': 9,
      'text': 'age 3\n\nMessage 4',
    });

    assert.deepStrictEqual(omitBy(result[5].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '5',
      'end': '7',
      'startOffset': 0,
      'endOffset': 4,
      'text': 'Message 6\n\nMessage 7\n\nMess',
    });
  }

  I.say('Test the overlaps of regions #2');
  AtParagraphs.clickFilter('Author 2', 'Author 3');
  AtLabels.clickLabel('Important Stuff');
  AtParagraphs.setSelection(
    AtParagraphs.locateText('age 3'),
    4,
    AtParagraphs.locateText('age 8'),
    3,
  );
  AtSidebar.seeRegions(9);

  {
    const result = await LabelStudio.serialize();

    assert.deepStrictEqual(omitBy(result[6].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '2',
      'end': '2',
      'startOffset': 8,
      'endOffset': 9,
      'text': '3',
    });

    assert.deepStrictEqual(omitBy(result[7].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '4',
      'end': '5',
      'startOffset': 0,
      'endOffset': 9,
      'text': 'Message 5\n\nMessage 6',
    });

    assert.deepStrictEqual(omitBy(result[8].value, (v, key)=> key === 'paragraphlabels'), {
      'start': '7',
      'end': '7',
      'startOffset': 0,
      'endOffset': 7,
      'text': 'Message',
    });
  }
});
