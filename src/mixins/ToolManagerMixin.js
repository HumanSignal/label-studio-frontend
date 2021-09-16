import { getRoot, types } from "mobx-state-tree";
import ToolsManager from "../tools/Manager";
import * as Tools from '../tools';

export const ToolManagerMixin = types.model().actions((self) => {
  const Super = {
    afterAttach: self.afterAttach ?? (() => {}),
  };

  return {
    afterAttach() {
      Super.afterAttach();

      console.log(getRoot(self));

      const toolNames = self.toolNames ?? [];
      const manager = ToolsManager.getInstance({ name: self.toname });
      const env = { manager, control: self };
      const tools = {};

      toolNames.forEach(toolName => {

        if (toolName in Tools) {
          const tool = Tools[toolName].create({}, env);

          tools[toolName] = tool;
        }
      });

      self.tools = tools;
    },
  };
});
