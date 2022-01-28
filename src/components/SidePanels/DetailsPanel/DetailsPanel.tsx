import { FC } from "react";
import { Elem } from "../../../utils/bem";
import { AnnotationHistory } from "../../CurrentEntity/AnnotationHistory";
import { PanelBase, PanelProps } from "../PanelBase";
import "./DetailsPanel.styl";

export const DetailsPanel: FC<PanelProps> = ({ ...props }) => {
  return (
    <PanelBase {...props} name="details" title="Details">
      <Elem name="section">
        <Elem name="section-head">
          Annotation History
        </Elem>
        <Elem name="section-content">
          <AnnotationHistory/>
        </Elem>
      </Elem>
    </PanelBase>
  );
};
