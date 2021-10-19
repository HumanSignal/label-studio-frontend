import { inject, observer } from "mobx-react";
import React, { useEffect } from "react";
import { LsAnnotation, LsParentLink, LsSparks } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { Block, Elem } from "../../utils/bem";
import { AnnotationHistory } from "./AnnotationHistory";
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

      console.log("Window event: cutHandler", ev);
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
      <Elem name="info" tag={Space} spread>
        <Elem name="id">
          {entity.type === 'annotation' ? <LsAnnotation /> : <LsSparks color="#944BFF"/>}
          <span className="text_id">ID: {entity.pk ?? entity.id}</span>
        </Elem>
      </Elem>

      <Elem name="parent_info">
        <Space size="small">
          {/*Always show container to keep the interface layout unchangeable*/}
          {(entity.parent_prediction) && (
            <Tooltip title="Prediction ID from which this annotation was created">
              <Elem name="parent-prediction">
                <Elem component={LsParentLink} name="parent_link"/>
                <Elem component={LsSparks} name="parent_icon_prediction"/>
                <Elem name="parent_text_prediction">ID: { entity.parent_prediction }</Elem>
              </Elem>
            </Tooltip>
          )}
          {(entity.parent_annotation) && (
            <Tooltip title="Parent annotation ID from which this annotation was created">
              <Elem name="parent-annotation">
                <Elem component={LsParentLink} name="parent_link"/>
                <Elem component={LsAnnotation} name="parent_icon_annotation"/>
                <Elem name="parent_text_annotation">ID: { entity.parent_annotation }</Elem>
              </Elem>
            </Tooltip>
          )}
        </Space>
      </Elem>

      <DraftPanel item={entity} />

      {showHistory && !entity.userGenerate && (
        <AnnotationHistory/>
      )}
    </Block>
  ) : null;
}));
