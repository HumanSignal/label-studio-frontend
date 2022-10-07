/* global locate */
const Helper = require('@codeceptjs/helper');

class Annotations extends Helper {

  get _playwright() {
    return this.helpers.Playwright;
  }

  _locateButton(text) {
    return this._playwright.locate('button').withText(text);
  }

  _clickSubmitButton(button) {
    const { Playwright } = this.helpers;

    Playwright.waitForEnabled(button, 60);
    Playwright.click(button);
  }

  submitAnnotation() {
    this._clickSubmitButton(this._locateButton('Submit'));
  }

  updateAnnotation() {
    this._clickSubmitButton(this._locateButton('Update'));
  }

  seeAnnotationSubmitted() {
    this.see(this._locateButton('Update'));
    this.dontSee(this._locateButton('Submit'));
  }
}

module.exports = Annotations;
