import { getRoot, types } from "mobx-state-tree";
import ProcessAttrsMixin from "./ProcessAttrs";
import { parseValue } from "../utils/data";


const DynamicChildrenMixin = types.model({
})
  .views(() => ({
    get defaultChildType() {
      console.error("DynamicChildrenMixin needs to implement defaultChildType getter in views");
      return undefined;
    },
  }))
  .actions(self => {
    const prepareDynamicChildrenData = (data) => data?.map?.(obj => ({
      type: self.defaultChildType,
      ...obj,
      children: prepareDynamicChildrenData(obj.children),
    }));

    const postprocessDynamicChildren = (children, store) => {
      children?.forEach(item => {
        postprocessDynamicChildren(item.children, store);
        item.updateValue?.(store);
      });
    };

    return {
      updateWithDynamicChildren(data) {
        const list = (self.children ?? []).concat(prepareDynamicChildrenData(data));

        self.children = list;
      },

      updateValue(store) {
        // If we want to use resolveValue or another asynchronous method here
        // we may need to rewrite this, initRoot and the other related methods
        // (actually a lot of them) to work asynchronously as well

        setTimeout(() => {
          self.updateDynamicChildren(store);
        });
      },

      updateDynamicChildren(store) {
        if (self.locked !== true) {
          const valueFromTask = parseValue(self.value, store.task.dataObj);

          if (!valueFromTask) return;

          self.updateWithDynamicChildren(valueFromTask);
          // self.generateDynamicChildren(valueFromTask, store);
          if (self.annotation) self.needsUpdate?.();
        }
      },

      generateDynamicChildren(data, store) {
        if (self.children) {
          const children = self.children;
          const len = children.length;
          const start = len - data.length;
          const slice = children.slice(start, len);

          postprocessDynamicChildren(slice, store);
        }
      },
    };
  });

export default types.compose(ProcessAttrsMixin, DynamicChildrenMixin);
