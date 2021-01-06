/* global Feature, Scenario */

const { initLabelStudio, serialize } = require("./helpers");
const examples = [
  require("../examples/audio-regions"),
  require("../examples/image-bboxes"),
  require("../examples/image-ellipses"),
  require("../examples/image-keypoints"),
  require("../examples/image-polygons"),
  require("../examples/ner-url"),
  require("../examples/nested"),
  require("../examples/text-html"),
  require("../examples/text-paragraphs"),
  require("../examples/timeseries-url-indexed"),
];

const assert = require("assert");
function roundFloats(struct) {
  return JSON.parse(
    JSON.stringify(struct, (key, value) => {
      if (typeof value === "number") {
        return value.toFixed(1);
      }
      return value;
    }),
  );
}
function assertWithTolerance(actual, expected) {
  assert.deepEqual(roundFloats(actual), roundFloats(expected));
}

Feature("Smoke test through all the examples");

examples.forEach(example =>
  Scenario(example.title || "Noname smoke test", async function(I) {
    // @todo optional predictions in example
    const { completions, config, data, result = completions[0].result } = example;
    const params = { completions: [{ id: "test", result }], config, data };

    const ids = [];
    // add all unique ids from non-classification results
    // @todo some classifications will be reflected in Results list soon
    result.forEach(r => !ids.includes(r.id) && Object.keys(r.value).length > 1 && ids.push(r.id));
    const count = ids.length;

    await I.amOnPage("/");
    await I.executeAsyncScript(initLabelStudio, params);

    I.see("Regions (" + count + ")");

    let restored;

    // repeatedly check if results are the same
    // they should be in a correct case, so if they not — data still haven't been loaded
    // so try again
    for (let i = 10; i--; ) {
      try {
        I.wait(2);
        // restore saved result and check it back that it didn't change
        restored = await I.executeScript(serialize);
        assertWithTolerance(restored, result);
        break;
      } catch (e) {}
    }

    assertWithTolerance(restored, result);

    if (count) {
      I.click(".ant-tree-treenode");
      // I.click('Delete Entity') - it founds something by tooltip, but not a button
      // so click the bin button in entity's info block
      I.click(".ls-entity-buttons span[aria-label=delete]");
      I.see("Regions (" + (count - 1) + ")");
      I.click("Reset");
      I.see("Regions (" + count + ")");
      // Reset is undoable
      I.click("Undo");

      // so after all these manipulations first region should be deleted
      restored = await I.executeScript(serialize);
      assertWithTolerance(
        restored,
        result.filter(r => r.id !== ids[0]),
      );
    }
  }),
);
