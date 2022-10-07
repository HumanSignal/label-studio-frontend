/* global locate */
const Helper = require('@codeceptjs/helper');

class Annotations extends Helper {

  _locateButton(text) {
    return locate('button').withText(text);
  }

  submitAnnotation() {
    const button = this._locateButton('Submit');

    this.waitForEnabled(button, 60);
    this.click(button);
  }

  updateAnnotation() {
    const button = this._locateButton('Update');

    this.waitForEnabled(button, 60);
    this.click(button);
  }
}

module.exports = Annotations;
