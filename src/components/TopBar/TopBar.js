import { observer } from "mobx-react";
import { Block, Elem } from "../../utils/bem";
import { DynamicPreannotationsToggle } from "../AnnotationTab/DynamicPreannotationsToggle";
import { Actions } from "./Actions";
import { Annotations } from "./Annotations";
import { Controls } from "./Controls";
import { CurrentTask } from "./CurrentTask";
import "./TopBar.styl";

export const TopBar = observer(({ store }) => {
  const entity = store.annotationStore?.selected;
  const isPrediction = entity?.type === 'prediction';

  return store ? (
    <Block name="topbar">
      <Elem name="group">
        <CurrentTask store={store}/>
        <Annotations
          store={store}
          annotationStore={store.annotationStore}
        />
        <Actions store={store}/>
      </Elem>
      <Elem name="group">
        <Elem name="section">
          <DynamicPreannotationsToggle />
        </Elem>
        {store.hasInterface("controls") && (store.hasInterface("review") || !isPrediction) && (
          <Elem name="section" mod={{ flat: true }} style={{ width: 320, boxSizing: 'border-box' }}>
            <Controls annotation={entity}/>
          </Elem>
        )}
      </Elem>
    </Block>
  ) : null;
});
