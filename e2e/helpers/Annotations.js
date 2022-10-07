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
    this._playwright.waitForEnabled(button, 60);
    this._playwright.click(button);
  }

  submitAnnotation() {
    this._clickSubmitButton(this._locateButton('Submit'));
  }

  updateAnnotation() {
    this._clickSubmitButton(this._locateButton('Update'));
  }

  seeAnnotationSubmitted() {
    this._playwright.see(this._locateButton('Update'));
    this._playwright.dontSee(this._locateButton('Submit'));
  }
}

module.exports = Annotations;
