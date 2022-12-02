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
  async dragAndDropMouse(from, to, button = 'left', steps = 1) {
    const page = getPage(this.helpers);

    await page.mouse.move(from.x, from.y, { steps });
    await page.mouse.down({ button });
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up({ button });
  }
}

module.exports = MouseActions;
