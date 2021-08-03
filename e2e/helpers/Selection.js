/* global locate */
const Helper = require('@codeceptjs/helper');

class Selection extends Helper {
  async dblClickOnWord(text, parent = "*") {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const { mouse } = page;
    let xpath = [locate(parent).toXPath(),`/text()[contains(., '${text}')]`,"[last()]"].join("");
    const textEls = await page.$x(xpath);
    const point = await page.evaluate((textEl, text)=>{
      const pos = textEl.wholeText.search(text);
      const range = new Range();
      range.setStart(textEl, pos);
      range.setEnd(textEl, pos+1);
      const bbox = range.getBoundingClientRect();
      return {
        x: (bbox.left + bbox.right) / 2,
        y: (bbox.top + bbox.bottom) / 2
      };
    },textEls[0], text);
    return mouse.click(point.x, point.y, { button: "left", clickCount: 2, delay: 50 });
  }
  async setSelection(startLocator, startOffset, endLocator, endOffset) {
    const { Puppeteer } = this.helpers;
    const { page } = Puppeteer;
    const startContainers = await page.$x(locate(startLocator).toXPath());
    const endContainers = await page.$x(locate(endLocator).toXPath());
    await page.evaluate((startContainer, startOffset, endContainer, endOffset)=>{
      const range = new Range();
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const evt = new MouseEvent("mouseup");
      evt.initMouseEvent("mouseup", true, true);
      endContainer.dispatchEvent(evt);
    },startContainers[0], startOffset, endContainers[0], endOffset);
  }
}

module.exports = Selection;
