/* global Feature, Scenario, locate */

const assert = require("assert");

Feature("smoke test");

// load custom example
const init = async (example, done) => {
  const interfaces = [
    "panel",
    "update",
    "controls",
    "side-column",
    "completions:menu",
    "completions:add-new",
    "completions:delete",
    "predictions:menu",
  ];
  const params = await window.getExample(example);
  new window.LabelStudio("label-studio", { interfaces, example, ...params });
  done();
};

// good idea, but it doesn't work :(
const emulateClick = source => {
  const event = document.createEvent("CustomEvent");
  event.initCustomEvent("click", true, true, null);
  event.clientX = source.getBoundingClientRect().top / 2;
  event.clientY = source.getBoundingClientRect().left / 2;
  source.dispatchEvent(event);
};

// click the Rect on the Konva canvas
const clickRect = () => {
  const rect = window.Konva.stages[0].findOne(n => n.className === "Rect");
  rect.fire("click", { clientX: 10, clientY: 10 });
};

const serialize = () => window.Htx.completionStore.selected.serializeCompletion();

Scenario("check Rect region for Image", async function(I) {
  I.amOnPage("/");
  I.executeAsyncScript(init, "ImageBbox");

  I.waitForVisible("canvas");
  I.see("Regions (1)");
  // select first and only region
  I.click(locate("li").withText("Rectangle"));
  I.see("Labels:");
  I.wait(2);

  // click on region's rect on the canvas
  I.executeScript(clickRect);
  I.dontSee("Labels:");
  I.wait(2);
});

Scenario("check simple nested Choice for Text", async function(I) {
  I.amOnPage("/");
  I.executeAsyncScript(init, "NestedSimple");

  I.see("Positive");
  I.dontSee("Emotional");
  I.click("Positive");
  I.see("Emotional");
  I.click("Emotional");

  const result = await I.executeScript(serialize);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].value, { choices: ["Positive"] });
  assert.deepEqual(result[1].value, { choices: ["Emotional"] });
});

Scenario("check good nested Choice for Text", async function(I) {
  I.amOnPage("/");
  I.executeAsyncScript(init, "Nested");

  const personTag = locate(".ant-tag").withText("Person");
  I.seeElement(personTag);
  I.click(personTag);
  I.doubleClick(".htx-text");
  I.see("Regions (1)");
  I.dontSee("Female");

  // header without selected region
  const regionsHeader = locate("div").withText("Regions (1)");
  // the only element of regions list after this header
  const regionInList = locate(".ant-list")
    .after(regionsHeader)
    .find("li");
  // select it
  I.click(regionInList);

  I.see("Regions (1)");

  I.click("Female");

  const result = await I.executeScript(serialize);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].value.labels, ["Person"]);
  assert.deepEqual(result[1].value.choices, ["Female"]);
});
