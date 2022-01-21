/* global inject */

const { I } = inject();
const Helpers = require("../tests/helpers");

module.exports = {
  init({ events = {}, ...params }) {
    I.executeAsyncScript(Helpers.initLabelStudio, params);
    for (const [eventName, callback] of Object.entries(events)) {
      this.on(eventName, callback);
    }
  },
  on(eventName, callback) {
    I.executeAsyncScript(Helpers.createAddEventListenerScript(eventName, callback));
  },
  async serialize() {
    const result = await I.executeScript(Helpers.serialize);

    return result;
  },
};
