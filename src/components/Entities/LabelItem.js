import { List, Tag } from "antd";
import { observer } from "mobx-react";
import { Button } from "../../common/Button/Button";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Block, Elem } from "../../utils/bem";
import { Space } from "../../common/Space/Space";

export const LabelItem = observer(({ item, regions, regionStore }) => {
  const bg = item.background;
  const labelStyle = {
    backgroundColor: bg,
    color: item.selectedcolor,
    cursor: "pointer",
    margin: "5px",
  };

  const isHidden = Object.values(regions).reduce((acc, item) => acc && item.hidden, true);

  return (
    <Block name="list-item" tag={List.Item} key={item.id}>
      <Space spread>
        <Tag style={labelStyle} size={item.size}>
          {item._value}
        </Tag>

        <Elem
          name="visibility"
          tag={Button}
          size="small"
          type="text"
          icon={isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => regionStore.setHiddenByLabel(!isHidden, item)}
          mod={{hidden: isHidden}}
        />
      </Space>
    </Block>
  );
});
