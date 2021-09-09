import { destroy } from "mobx-state-tree";
import { guidGenerator } from "../utils/unique";

/** @type {ToolsManager} */
let instance = null;

class ToolsManager {
  static getInstance(...args) {
    return instance ?? (instance = new ToolsManager(...args));
  }

  constructor({ obj } = {}) {
    this.obj = obj;
    this.tools = {};
    this._default_tool = null;
  }

  addTool(name, tool, prefix = guidGenerator()) {
    // todo: It seems that key is using only for storing,
    // but not for finding tools, so may be there might
    // be an array instead of an object
    const key = `${prefix}#${name}`;

    this.tools[key] = tool;

    if (tool.default && !this._default_tool && !this.hasSelected) {
      this._default_tool = tool;
      if (tool.setSelected) tool.setSelected(true);
    }
  }

  unselectAll() {
    // when one of the tool get selected you need to unselect all
    // other active tools
    Object.values(this.tools).forEach(t => {
      if (typeof t.selected !== "undefined") t.setSelected(false);
    });

    const stage = this.obj?.stageRef;

    if (stage) {
      stage.container().style.cursor = "default";
    }
  }

  selectTool(tool, value) {
    if (value) {
      this.unselectAll();
      if (tool.setSelected) tool.setSelected(true);
    } else {
      const drawingTool = this.findDrawingTool();

      if (drawingTool) return this.selectTool(drawingTool, true);
      if (tool.setSelected) tool.setSelected(false);
    }
  }

  selectDefault() {
    const tool = this.findSelectedTool();

    if (this._default_tool && tool?.dynamic === true) {
      this.unselectAll();
      this._default_tool.setSelected(true);
    }
  }

  allTools() {
    return Object.values(this.tools);
  }

  addToolsFromControl(s) {
    const self = this;

    if (s.tools) {
      const t = s.tools;

      Object.keys(t).forEach(k => {
        self.addTool(k, t[k], s.name || s.id);
      });
    }
  }

  findSelectedTool() {
    return Object.values(this.tools).find(t => t.selected);
  }

  findDrawingTool() {
    return Object.values(this.tools).find(t => t.isDrawing);
  }

  event(name, ev, ...args) {
    // if there is an active tool, dispatch there
    const selectedTool = this.findSelectedTool();

    if (selectedTool) {
      selectedTool.event(name, ev, args);
      return;
    }
  }

  reload({ obj } = {}) {
    this.removeAllTools();

    this.obj = obj;
    this.tools = {};
    this._default_tool = null;
  }

  removeAllTools() {
    Object.values(this.tools).forEach(t => destroy(t));
    this.tools = {};
  }

  get hasSelected() {
    return Object.values(this.tools).some(t => t.selected);
  }
}

window.ToolManager = ToolsManager;

export default ToolsManager;
