import { inject, observer } from "mobx-react";
import Toggle from "../../common/Toggle/Toggle";
import { Block } from "../../utils/bem";
import "./DynamicPreannotations.styl";

export const DynamicPreannotationsToggle = inject("store")(({ store }) => {
  return (
    <Block name="dynamic-preannotations">
      <Toggle
        checked={store.dynamicPreannotations}
        onChange={(e) => {
          store.setDynamicPreannotation(e.target.checked);
        }}
        label="Auto-Annotation"
        style={{ color: "#7F64FF" }}
      />
    </Block>
  );
});
