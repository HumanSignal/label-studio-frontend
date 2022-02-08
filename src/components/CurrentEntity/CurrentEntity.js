import { inject, observer } from "mobx-react";
import React, { useEffect } from "react";
import { Block } from "../../utils/bem";
import { AnnotationHistory } from "./AnnotationHistory.tsx";
import "./CurrentEntity.styl";
import { DraftPanel } from "../DraftPanel/DraftPanel";

const injector = inject('store');

export const CurrentEntity = injector(observer(({
  entity,
  showHistory = true,
}) => {

  useEffect(()=>{
    const copyToClipboard = (ev) => {
      const { clipboardData } = ev;
      const results = entity.serializedSelection;

      clipboardData.setData('application/json', JSON.stringify(results));
      ev.preventDefault();

    };
    const pasteFromClipboard = (ev) => {
      const { clipboardData } = ev;
      const data = clipboardData.getData('application/json');

      try {
        const results = JSON.parse(data);

        entity.appendResults(results);
        ev.preventDefault();
      } catch (e) {
        return;
      }
    };

    const copyHandler = (ev) =>{
      const selection = window.getSelection();

      if (!selection.isCollapsed) return;

      copyToClipboard(ev);
    };
    const pasteHandler = (ev) =>{
      const selection = window.getSelection();

      if (Node.ELEMENT_NODE === selection.focusNode?.nodeType && selection.focusNode?.focus) return;

      pasteFromClipboard(ev);
    };
    const cutHandler = (ev) =>{
      const selection = window.getSelection();

      if (!selection.isCollapsed) return;

      copyToClipboard(ev);
      entity.deleteSelectedRegions();
    };

    window.addEventListener("copy", copyHandler);
    window.addEventListener("paste", pasteHandler);
    window.addEventListener("cut", cutHandler);
    return () => {
      window.removeEventListener("copy", copyHandler);
      window.removeEventListener("paste", pasteHandler);
      window.removeEventListener("cut", cutHandler);
    };
  }, [entity.pk ?? entity.id]);

  return entity ? (
    <Block name="annotation" onClick={e => e.stopPropagation()}>
      {/* <Elem name="info" tag={Space} spread>
        <Elem name="id">
          {entity.type === 'annotation' ? <LsAnnotation /> : <LsSparks color="#944BFF"/>}
          <span className="text_id">ID: {entity.pk ?? entity.id}</span>
        </Elem>
      </Elem> */}

      {/* <Elem name="parent_info">
        <Space size="small"> */}
      {/*Always show container to keep the interface layout unchangeable*/}
      {/* {(entity.parent_prediction) && (
            <Tooltip title="Prediction ID from which this annotation was created">
              <Elem name="parent">
                <Elem tag={LsParentLink} name="parent_link"/>
                <Elem tag={LsSparks} name="parent_icon" mod={{ prediction: true }}/>
                <Elem name="parent_text">ID: { entity.parent_prediction }</Elem>
              </Elem>
            </Tooltip>
          )}
          {(entity.parent_annotation) && (
            <Tooltip title="Parent annotation ID from which this annotation was created">
              <Elem name="parent">
                <Elem tag={LsParentLink} name="parent_link"/>
                <Elem tag={LsAnnotation} name="parent_icon" mod={{ annotation: true }}/>
                <Elem name="parent_text">ID: { entity.parent_annotation }</Elem>
              </Elem>
            </Tooltip>
          )} */}
      {/* </Space>
      </Elem> */}

      <DraftPanel item={entity} />

      {showHistory && !entity.userGenerate && (
        <AnnotationHistory/>
      )}
    </Block>
  ) : null;
}));
