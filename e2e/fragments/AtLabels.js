/* global inject, locate */
const { I } = inject();

module.exports = {
  locateLabel(text) {
    return locate(".lsf-label").withText(text);
  },
  locateSelected() {
    return locate(".lsf-label.lsf-label_selected");
  },
  clickLabel(text) {
    I.click(this.locateLabel(text));
  }
};
