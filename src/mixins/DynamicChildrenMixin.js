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
      updateValue: flow(function * (store) {
        const valueFromTask = parseValue(self.value, store.task.dataObj);

        if (!valueFromTask) return;
        const value = yield self.resolveValue(valueFromTask);

        self.generateDynamicChildren(value, store);
        self.needsUpdate?.();
      }),

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