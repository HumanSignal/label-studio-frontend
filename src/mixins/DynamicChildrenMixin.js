import { flow, types } from "mobx-state-tree";
import ProcessAttrsMixin from "./ProcessAttrs";
import { parseValue } from "../utils/data";

const DynamicChildrenMixin = types.model({
})
  .views(self => {
    return {
      get defaultChildType() {
        console.error("DynamicChildrenMixin needs to implement defaultChildType getter in views");
        return undefined;
      },
    };
  })
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
      updateValue(store) {
        // If we want to use resolveValue or another asynchronous method here
        // we may need to rewrite this, initRoot and the other related methods
        // (actually a lot of them) to work asynchronously as well

        const valueFromTask = parseValue(self.value, store.task.dataObj);

        if (!valueFromTask) return;

        self.generateDynamicChildren(valueFromTask, store);
        if (self.annotation) self.needsUpdate?.();
      },

      generateDynamicChildren(data, store) {
        if (!self.children) {
          self.children = prepareDynamicChildrenData(data);
        } else {
          self.children.push(...prepareDynamicChildrenData(data));
        }

        if (self.children) postprocessDynamicChildren(self.children.slice(self.children.length - data.length,self.children.length), store);
      },
    };
  });

export default types.compose(ProcessAttrsMixin, DynamicChildrenMixin);