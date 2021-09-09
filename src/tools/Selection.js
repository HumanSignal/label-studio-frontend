import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";
import { SelectOutlined } from "@ant-design/icons";

const _Tool = types.model("SelectionTool").views(() => {
  return {
    get isSeparated() {
      return true;
    },
    get viewTooltip() {
      return "Selection tool";
    },
    get iconComponent() {
      return SelectOutlined;
    },
    get useTransformer() {
      return true;
    },
  };
}).actions(self => {
  let isSelecting = false;

  return {
    shouldSkipInteractions() {
      return false;
    },

    mousedownEv(ev, [x, y]) {
      isSelecting = true;
      self.obj.setSelectionStart({ x, y });
    },

    mousemoveEv(ev, [x, y]) {
      if (!isSelecting) return;
      self.obj.setSelectionEnd({ x,y });
    },

    mouseupEv(ev, [x, y]) {
      if (!isSelecting) return;
      self.obj.setSelectionEnd({ x,y });
      const { regionsInSelectionArea } = self.obj;

      self.obj.resetSelection();
      if (ev.ctrlKey || ev.metaKey) {
        self.annotation.extendSelectionWith(regionsInSelectionArea);
      } else {
        self.annotation.selectAreas(regionsInSelectionArea);
      }
      isSelecting = false;
    },
  };
});

const Selection = types.compose(ToolMixin, BaseTool, AnnotationMixin, _Tool);

export { Selection };
