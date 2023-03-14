Feature('Skip duplicates (textarea)');

const SKIP_DUPLICATES_ERROR = 'There is already an entry with that text. Please enter unique text.';

const scenarioDataTable = new DataTable(['scenarioKey']);

const SK_SIMPLE = 'Simple textarea';
const SK_PER_REGION = 'Per region';
const SK_OCR = 'Ocr';

scenarioDataTable.add([SK_SIMPLE]);
scenarioDataTable.add([SK_PER_REGION]);
scenarioDataTable.add([SK_OCR]);

const SCENARIO_PARAMS = {
  [SK_SIMPLE]: {
    data: { question: 'Is it a question?' },
    config: `<View>
  <Text name="question" value="$question"/>
  <TextArea name="answer" toName="question" skipDuplicates="true"/>
</View>`,
    fieldSelector: '[name="answer"]',
    text: 'Isn\'t it?',
    textAlt: 'isn\'t IT?',
    textOther: 'Maybe',
  },
  [SK_PER_REGION]: {
    data: { 'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Html_headers.png/640px-Html_headers.png' },
    config: `<View>
  <Image name="image" value="$image"></Image>
  <Rectangle name="imageRectangle" toName="image"/>
  <TextArea name="text" toName="image" editable="true" perRegion="true"
            placeholder="Recognized Text" skipDuplicates="true" />
</View>
`,
    annotations: [{
      id: 'test',
      result: [{
        id: 'id_1',
        from_name: 'imageRectangle',
        to_name: 'image',
        type: 'rectangle',
        value: {
          'x': 0.625,
          'y': 1.183431952662722,
          'width': 34.375,
          'height': 5.719921104536489,
        },
      }],
    }],
    shouldSelectRegion: true,
    fieldSelector: '[name="text"]',
    text: 'The "H1" Header',
    textAlt: 'the "h1" HEADER',
    textOther: 'Wrong text',
  },
  [SK_OCR]: {
    data: { 'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Html_headers.png/640px-Html_headers.png' },
    config: `<View>
  <Image name="image" value="$image"></Image>
  <Rectangle name="imageRectangle" toName="image"/>
  <TextArea name="ocr" toName="image" editable="true" perRegion="true"
            placeholder="Recognized Text" displayMode="region-list" skipDuplicates="true" maxsubmissions="5"/>
</View>
`,
    annotations: [{
      id: 'test',
      result: [{
        id: 'id_1',
        from_name: 'imageRectangle',
        to_name: 'image',
        type: 'rectangle',
        value: {
          'x': 0.625,
          'y': 1.183431952662722,
          'width': 34.375,
          'height': 5.719921104536489,
        },
      }],
    }],
    shouldSelectRegion: true,
    fieldSelector: '.lsf-textarea-tag__form input',
    text: 'The "H1" Header',
    textAlt: 'the "h1" HEADER',
    textOther: 'Wrong text',
  },
};

Data(scenarioDataTable).Scenario('Skip duplicate values on entering', async ({ I, LabelStudio, AtSidebar, Modals, current }) => {
  const scenarioKey = current.scenarioKey;
  const {
    data,
    config,
    annotations,
    shouldSelectRegion,
    fieldSelector,
    text,
    textAlt,
    textOther,
  } = SCENARIO_PARAMS[scenarioKey];

  I.amOnPage('/');
  LabelStudio.init({
    data,
    config,
    annotations,
  });
  LabelStudio.waitForObjectsReady();

  if (shouldSelectRegion) AtSidebar.clickRegion(1);

  I.fillField(fieldSelector, text);
  I.pressKey('Enter');

  I.fillField(fieldSelector, text);
  I.pressKey('Enter');

  Modals.seeWarning(SKIP_DUPLICATES_ERROR);
  Modals.closeWarning();

  I.fillField(fieldSelector, textAlt);
  I.pressKey('Enter');

  Modals.seeWarning(SKIP_DUPLICATES_ERROR);
  Modals.closeWarning();

  I.fillField(fieldSelector, textOther);
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);

  I.fillField(fieldSelector, textOther);
  I.pressKey('Enter');

  Modals.seeWarning(SKIP_DUPLICATES_ERROR);

  I.fillField(fieldSelector, text);
  I.pressKey('Enter');

  Modals.seeWarning(SKIP_DUPLICATES_ERROR);
});

Scenario('Independent skip duplicate values', async ({ I, LabelStudio, AtSidebar, Modals }) => {
  I.amOnPage('/');
  LabelStudio.init({
    data: { letter: 'Aa' },
    config: `<View>
  <Text name="letter" value="$letter"/>
  <Labels name="label" toName="letter">
    <Label value="Letter A" background="yellow"/>
  </Labels>
  <TextArea name="perText" toName="letter" skipDuplicates="true"/>
  <TextArea name="perText2" toName="letter" skipDuplicates="true"/>
  <TextArea name="perRegion" toName="letter" skipDuplicates="true" perRegion="true" maxsubmissions="5"/>
  <TextArea name="perRegionAndAside" toName="letter" skipDuplicates="true" perRegion="true" maxsubmissions="5" displayMode="region-list"/>
</View>`,
    annotations: [{
      id: 'test',
      result: [
        {
          id: 'letter_A',
          from_name: 'label',
          to_name: 'letter',
          type: 'labels',
          value: { start: 0, end: 1, labels: ['Letter A'], text: 'A' },
        },
        {
          id: 'letter_a',
          from_name: 'label',
          to_name: 'letter',
          type: 'labels',
          value: { start: 1, end: 2, labels: ['Letter A'], text: 'a' },
        },
      ],
    }],
  });

  I.fillField('[name="perText"]', 'A');
  I.pressKey('Enter');

  I.fillField('[name="perText2"]', 'A');
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);

  AtSidebar.clickRegion(1);

  I.fillField('[name="perRegion"]', 'A');
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);

  I.fillField(AtSidebar.locateSelectedRegion('.lsf-textarea-tag__form input'), 'A');
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);

  AtSidebar.clickRegion(2);

  I.fillField('[name="perRegion"]', 'A');
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);

  I.fillField(AtSidebar.locateSelectedRegion('.lsf-textarea-tag__form input'), 'A');
  I.pressKey('Enter');

  Modals.dontSeeWarning(SKIP_DUPLICATES_ERROR);
});