import { Badge, List } from "antd";
import { observer } from "mobx-react";
import { getRoot, isAlive } from "mobx-state-tree";
import { Button } from "../../common/Button/Button";
import { Node } from "../Node/Node";
import styles from "./Entities.module.scss";
import Utils from "../../utils";

import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import "./RegionItem.styl";

const RegionItemContent = observer(({ idx, item }) => {
  return (
    <Block name="region-item">
      <Elem name="counter">{isDefined(idx) ? idx + 1 : ""}</Elem>

      <Node node={item} className={styles.node} />

      {!item.editable && <Badge count={"ro"} style={{ backgroundColor: "#ccc" }} />}

      {item.hideable && (
        <Elem
          tag={Button}
          name="toggle"
          size="small"
          type="text"
          mod={{ active: !item.hidden }}
          icon={item.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={item.toggleHidden}
        />
      )}

      {item.score && (
        <Elem
          tag="span"
          name="score"
          style={{
            color: Utils.Colors.getScaleGradient(item.score),
          }}
        >
          {item.score.toFixed(2)}
        </Elem>
      )}
    </Block>
  );
});

export const RegionItem = observer(({ item, idx, flat }) => {
  if (!isAlive(item)) return null;

  const as = getRoot(item).annotationStore;
  const anno = as.selectedHistory ?? as.selected;
  const classnames = [
    styles.lstitem,
    flat && styles.flat,
    item.hidden === true && styles.hidden,
    item.selected && styles.selected,
  ].filter(Boolean);

  return (
    <List.Item
      key={item.id}
      className={classnames.join(" ")}
      onClick={() => anno.selectArea(item)}
      onMouseOver={() => item.setHighlight(true)}
      onMouseOut={() => item.setHighlight(false)}
    >
      <RegionItemContent idx={idx} item={item} />
    </List.Item>
  );
});
