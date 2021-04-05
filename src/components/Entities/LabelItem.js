import { Tag } from "antd";
import { observer } from "mobx-react";

export const LabelItem = observer(({ item }) => {
  const bg = item.background;
  const labelStyle = {
    backgroundColor: bg,
    color: item.selectedcolor,
    cursor: "pointer",
    margin: "5px",
  };

  return (
    <Tag style={labelStyle} color={item.selectedcolor} size={item.size}>
      {item._value}
    </Tag>
  );
});
