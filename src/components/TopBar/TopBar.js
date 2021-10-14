import { observer } from "mobx-react";
import { Block, Elem } from "../../utils/bem";
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
        <Annotations store={store}/>
        <Actions store={store}/>
      </Elem>
      <Elem name="group">
        {store.hasInterface("controls") && (store.hasInterface("review") || !isPrediction) && (
          <Elem name="section">
            <Controls annotation={entity}/>
          </Elem>
        )}
      </Elem>
    </Block>
  ) : null;
});
