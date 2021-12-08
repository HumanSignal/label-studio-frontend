import { FC } from "react";
import { PanelBase, PanelProps } from "../PanelBase";

export const DetailsPanel: FC<PanelProps> = ({ ...props }) => {
  return (
    <PanelBase {...props} name="details" title="Details">
      Outliner
    </PanelBase>
  );
};
