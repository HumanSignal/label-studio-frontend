const Helper = require('@codeceptjs/helper');

const getPage = (h) => {
  return (h.Puppeteer ?? h.Playwright).page;
};

class MouseActions extends Helper {
  clickAt(x, y, buttonName = 'left') {
    const page = getPage(this.helpers);

    return page.mouse.click(x, y, { button: buttonName, delay: 80 });
  }
  pressMouseDown(buttonName = 'left') {
    const page = getPage(this.helpers);

    return page.mouse.down({ button: buttonName });
  }
  pressMouseUp(buttonName = 'left') {
    const page = getPage(this.helpers);

    return page.mouse.up({ button: buttonName });
  }
  moveMouse(x, y, steps = 1) {
    const page = getPage(this.helpers);

    return page.mouse.move(x, y, { steps });
  }

  /**
   * Mouse wheel action
   * @param {{deltaY: number, deltaX: number}} deltas
   */
  mouseWheel({ deltaX = 0, deltaY = 0 }) {
    const page = getPage(this.helpers);

    return page.mouse.wheel(deltaX, deltaY);
  }
}

module.exports = MouseActions;
