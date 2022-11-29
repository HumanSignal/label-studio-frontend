/* global Feature, Scenario */

const assert = require('assert');

Feature('Richtext cases').tag('@regress');

const createConfig = (tag = 'Text', granularity = 'symbol') => {
  return `<View>
    <Labels name="label" toName="text">
        <Label value="Label" background="green"/>
    </Labels>
    <${tag} name="text" value="$text" inline="true" ${granularity ? `granularity="${granularity}"` : ''}/>
</View>`;
};

Scenario('Broken limits', async ({ I, LabelStudio, AtSidebar, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [
          {
            id: 'a',
            from_name: 'label',
            to_name: 'text',
            type: 'labels',
            value: { start: -1, end: 6, labels: ['Label'], text: 'Second' },
          },
        ],
      }],
    config: createConfig(),
    data: { text: 'First line\nSecond line' },
  });
  AtSidebar.seeRegions(1);
  AtSidebar.clickRegion('1');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('The selection in degenerate cases', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [{ id: 'test', result: [] }],
    config: createConfig(),
    data: { text: '\n\nThird line' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(0, 2);
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Exactly 1 word', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('Text', 'word'),
    data: { text: 'Somé wórds\n\nwíth\n\nmultiline' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.dblClickOnWord('Somé');
  AtSidebar.see('Somé');
  AtSidebar.dontSee('Somé wórds');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Trim spaces around the word', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('Text', 'word'),
    data: { text: 'One two three four five six' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.dblClickOnWord('four');
  AtSidebar.see('four');
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(3,8);
  AtSidebar.see('two');
  const result = await LabelStudio.serialize();

  assert.strictEqual(result[0].value.text,'four');
  assert.strictEqual(result[1].value.text,'two');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Trim spaces with BRs', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('Text', 'word'),
    data: { text: 'Three\n\n\nBRs\n\n\ntrim test' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(5,14);
  AtSidebar.see('BRs');
  const result = await LabelStudio.serialize();

  assert.strictEqual(result[0].value.text,'BRs');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Overlap checks', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig(),
    data: { text: 'Halfword' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(0,4);
  AtSidebar.see('Half');
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(4,8);
  I.seeNumberOfElements(AtRichText.locate('span.htx-highlight'), 2);
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Non-standard characters in words', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('Text', 'word'),
    data: { text: 'Somé wórds' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.selectTextByGlobalOffset(0,5);
  AtSidebar.seeRegions(1);
  AtSidebar.see('Somé');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Should not select words from next line', async ({ I, LabelStudio, AtSidebar, AtRichText, ErrorsCollector }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('Text', 'word'),
    data: { text: 'Оne\nline' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.setSelection(AtRichText.locateText(),0,AtRichText.locateRoot(), 2);
  AtSidebar.seeRegions(1);
  AtSidebar.see('Оne');
  AtSidebar.dontSee('line');
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});

Scenario('Trying to select alt attr', async ({ I, LabelStudio, AtSidebar, ErrorsCollector, AtRichText }) => {
  I.amOnPage('/');
  await ErrorsCollector.run();
  LabelStudio.init({
    annotations: [
      {
        id: 'test', result: [],
      }],
    config: createConfig('HyperText', 'word'),
    data: { text: 'The bad <img alt=\'image\'> we got here' },
  });
  AtSidebar.seeRegions(0);
  I.pressKey('1');
  AtRichText.dblClickOnElement('img[alt="image"]');
  AtSidebar.seeRegions(0);
  const errors = await ErrorsCollector.grabErrors();

  if (errors.length) {
    assert.fail(`Got an error: ${errors[0]}`);
  }
});
