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
    const { annotations, config, data, result = annotations[0].result } = example;
    const params = { annotations: [{ id: "test", result }], config, data };

    const ids = [];
    // add all unique ids from non-classification results
    // @todo some classifications will be reflected in Results list soon
    result.forEach(r => !ids.includes(r.id) && Object.keys(r.value).length > 1 && ids.push(r.id));
    const count = ids.length;

    await I.amOnPage("/");
    await I.executeAsyncScript(initLabelStudio, params);

    I.see(`${count} Region${(count === 0 || count > 1) ? 's' : ''}`);

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
      I.click(".ant-list-item");
      // I.click('Delete Entity') - it founds something by tooltip, but not a button
      // so click the bin button in entity's info block
      I.click(".ls-entity-buttons span[aria-label=delete]");
      I.see(`${count-1} Region${(count-1) > 1 ? 's' : ''}`);
      I.click(".lsf-history__action[aria-label=Reset]");
      I.see(`${count} Region${count > 1 ? 's' : ''}`);
      // Reset is undoable
      I.click(".lsf-history__action[aria-label=Undo]");

      // so after all these manipulations first region should be deleted
      restored = await I.executeScript(serialize);
      assertWithTolerance(
        restored,
        result.filter(r => r.id !== ids[0]),
      );
    }
  }),
);
