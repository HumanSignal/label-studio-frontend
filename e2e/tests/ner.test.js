/* global Feature, Scenario, locate */

const { initLabelStudio, serialize } = require("./helpers");

const assert = require("assert");

Feature("Nested Choices");

const configSimple = `
  <View>
    <HyperTextLabels name="ner" toName="text">
      <Label value="Person"></Label>
      <Label value="Organization"></Label>
    </HyperTextLabels>
    <HyperText name="text" value="$text"></HyperText>
  </View>
`;

const text = `<div>
    <details>
      <summary role="button">Dismiss <span>...</span></summary>
      <details-menu style="width: 230px" role="menu">
        <p><span>Dismiss for this repository only</span></p>
        <p><span>Dismiss for all repositories</span></p>
      </details-menu>
    </details>
    <div>
      <h4>First time contributing to heartexlabs/label-studio?</h4>
      <p>If you know how to fix an <a href="/heartexlabs/label-studio/issues">issue</a>, consider opening a pull request for it.</p>
      <p>You can read this repository’s <a target="_blank" title="A must-read for how to contribute to heartexlabs/label-studio" href="/heartexlabs/label-studio/blob/master/CONTRIBUTING.md">contributing guidelines</a> to learn how to open a good pull request.</p>
    </div>
  </div>`;

Scenario("NER labeling for HyperText", async function(I) {
  const params = {
    config: configSimple,
    data: { text },
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.click(".ls-segment details");
  I.pressKey("1");
  I.doubleClick(".ls-segment details p");

  I.pressKey("2");
  I.click(".ls-segment h4");
  I.pressKeyDown("Shift");
  I.click(".ls-segment details p:last-child");
  I.pressKeyUp("Shift");

  I.click(".ant-list-items > div:nth-child(2)");
  // @todo this hotkey doesn't work. why?
  // I.pressKey('r')
  I.click("Create Relation");
  I.click(".ls-segment details p span");

  I.see("Relations (1)");

  const result = await I.executeScript(serialize);
  assert.equal(result.length, 3);
  assert.equal(result[2].type, "relation");
});
