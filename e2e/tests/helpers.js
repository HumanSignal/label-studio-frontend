/**
 * Load custom example
 * @param {object} params
 * @param {string} params.config
 * @param {object} params.data object with property used in config
 * @param {object[]} params.completions
 * @param {object[]} params.predictions
 * @param {function} done
 */
const initLabelStudio = async ({ config, data, completions = [{ result: [] }], predictions = [] }, done) => {
  if (window.Konva && window.Konva.stages.length) window.Konva.stages.forEach(stage => stage.destroy());

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
  const task = { data, completions, predictions };
  new window.LabelStudio("label-studio", { interfaces, config, task });
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

module.exports = { initLabelStudio, emulateClick, clickRect, serialize };
