import { observer } from "mobx-react";
import React from "react";
import { LsTrash } from "../../assets/icons";
import { Button } from "../../common/Button/Button";
import { confirm } from "../../common/Modal/Modal";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import { Space } from "../../common/Space/Space";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { Block, Elem } from "../../utils/bem";
import { AnnotationHistory } from "./AnnotationHistory";
import { Controls } from "./Controls";
import "./CurrentAnnotation.styl";
import { HistoryActions } from "./HistoryActions";

export const CurrentAnnotation = observer(({
  annotation,
  canDelete = true,
  showControls = true,
  showHistory = true,
}) => {
  return annotation ? (
    <Block name="annotation" onClick={e => e.stopPropagation()}>
      <Elem name="info">
        ID: {annotation.pk ?? annotation.id}
      </Elem>

      <Space spread style={{ margin: "8px 0" }}>
        <HistoryActions
          history={annotation.history}
        />

        {canDelete && (
          <Tooltip title="Delete annotation">
            <Button
              icon={<LsTrash />}
              look="danger"
              type="text"
              onClick={() => {
                confirm({
                  title: "Delete annotaion",
                  body: "This action cannot be undone",
                  buttonLook: "destructive",
                  okText: "Proceed",
                  onOk: () => annotation.list.deleteAnnotation(annotation),
                });
              }}
              style={{
                height: 36,
                width: 36,
                padding: 0,
              }}
            />
          </Tooltip>
        )}
      </Space>

      {showControls && <Controls annotation={annotation}/>}

      {showHistory && !annotation.userGenerate && (
        <AnnotationHistory/>
      )}
    </Block>
  ) : null;
});
