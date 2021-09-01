import { inject, observer } from "mobx-react";
import { IconCheck, IconCross } from "../../assets/icons";
import { Button } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";
import Toggle from "../../common/Toggle/Toggle";
import { Block, Elem } from "../../utils/bem";
import "./DynamicPreannotationsToggle.styl";

const injector = inject(({ store }) => {
  const annotation = store.annotationStore?.selected;
  const suggestions = annotation?.suggestions;

  return {
    store,
    annotation,
    suggestions,
  };
});

export const DynamicPreannotationsToggle = injector(observer(({
  store,
  annotation,
  suggestions,
}) => {
  return (
    <Block name="dynamic-preannotations">
      <Elem name="wrapper">
        <Space spread>
          <Toggle
            checked={store.dynamicPreannotations}
            onChange={(e) => {
              store.setDynamicPreannotation(e.target.checked);
            }}
            label="Auto-Annotation"
            style={{ color: "#7F64FF" }}
          />
          {suggestions.size > 0 && (
            <Space size="small">
              <Elem name="action" tag={Button} mod={{ type: "reject" }} onClick={() => annotation.rejectAllSuggestions()}>
                <IconCross/>
              </Elem>
              <Elem name="action" tag={Button} mod={{ type: "accept" }} onClick={() => annotation.acceptAllSuggestions()}>
                <IconCheck/>
              </Elem>
            </Space>
          )}
        </Space>
      </Elem>
    </Block>
  );
}));
