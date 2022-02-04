const Helper = require('@codeceptjs/helper');

class MouseActions extends Helper {
  clickAt(x, y, buttonName = "left") {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const { mouse } = page;

    return mouse.click(x, y, { button: buttonName, delay: 80 });
  }
  pressMouseDown(buttonName = "left") {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const { mouse } = page;

    return mouse.down({ button: buttonName });
  }
  pressMouseUp(buttonName = "left") {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const { mouse } = page;

    return mouse.up({ button: buttonName });
  }
  moveMouse(x, y, steps = 1) {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const { mouse } = page;

    return mouse.move(x, y, { steps });
  }
}

module.exports = MouseActions;
