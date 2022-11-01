import { observer } from "mobx-react";
import { Block, Elem } from "../../utils/bem";
import { DynamicPreannotationsToggle } from "../AnnotationTab/DynamicPreannotationsToggle";
import { Actions } from "./Actions";
import { Annotations } from "./Annotations";
import { Controls } from "./Controls";
import { CurrentTask } from "./CurrentTask";
import "./TopBar.styl";

export const TopBar = observer(({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore?.selected;
  const isReadonly = entity?.readonly;

  const isViewAll = annotationStore?.viewingAll === true;

  return store ? (
    <Block name="topbar">
      <Elem name="group">
        <CurrentTask store={store}/>
        {!isViewAll && (
          <Annotations
            store={store}
            annotationStore={store.annotationStore}
            commentStore={store.commentStore}
          />
        )}
        <Actions store={store}/>
      </Elem>
      <Elem name="group">
        {!isViewAll && (

          <Elem name="section">
            <DynamicPreannotationsToggle />
          </Elem>
        )}
        {!isViewAll && store.hasInterface("controls") && (store.hasInterface("review") || !isReadonly) && (
          <Elem name="section" mod={{ flat: true }} style={{ width: 320, boxSizing: 'border-box' }}>
            <Controls annotation={entity}/>
          </Elem>
        )}
      </Elem>
    </Block>
  ) : null;
});
