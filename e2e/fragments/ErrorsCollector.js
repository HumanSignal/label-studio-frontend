/* global inject */
const { I } = inject();

function startErrorsCollector(done) {
  function CEErrorsCollector() {
    this.errors = [];
    this.errorHandler = this.errorHandler.bind(this);
    this._start();
  }

  CEErrorsCollector.prototype.errorHandler = function (ev)  {
    this.errors.push(ev.message);
  };
  CEErrorsCollector.prototype.destroy = function () {
    this.errors = null;
    this._finish();
  };
  CEErrorsCollector.prototype._start = function()  {
    window.addEventListener("error", this.errorHandler);
  };
  CEErrorsCollector.prototype._finish = function()  {
    window.removeEventListener("error", this.errorHandler);
  };
  window._ceErrorsCollector = new CEErrorsCollector();
  done();
}

function stopErrorsCollector(done) {
  window._ceErrorsCollector.destroy();
  done();
}

function getErrors(done) {
  done(window._ceErrorsCollector.errors);
}

module.exports = {
  run() {
    I.executeAsyncScript(startErrorsCollector);
  },
  stop() {
    I.executeAsyncScript(stopErrorsCollector);
  },
  async grabErrors() {
    const errors = await I.executeAsyncScript(getErrors);
    return errors;
  },
};