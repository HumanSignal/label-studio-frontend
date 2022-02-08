import { FC } from "react";
import { Block } from "../../../utils/bem";
import "./RegionEditor.styl";

interface RegionEditorProps {
  region: any;
}

export const RegionEditor: FC<RegionEditorProps> = ({
  region,
}) => {
  return (
    <Block name="region-editor">
      {region.editorEnabled && region.editableFields.map((field: any, i) => {
        return (
          <input
            key={i}
            value={region.getProperty(field.property)}
            onChange={(e) => region.setProperty(field.property, e.target.value)}
          />
        );
      })}
    </Block>
  );
};
