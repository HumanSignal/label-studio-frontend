import { DownOutlined } from "@ant-design/icons";
import styles from "./Entities.module.scss";
import { Tree } from "antd";
import { LabelItem } from "./LabelItem";
import { RegionItem } from "./RegionItem";
import { observer } from "mobx-react";

export const LabelList = observer(({ regionStore }) => {
  const treeData = regionStore.asLabelsTree((item, idx, isLabel) => {
    return {
      key: item.id,
      title: isLabel ? <LabelItem item={item} idx={idx} /> : <RegionItem item={item} idx={idx} />,
    };
  });

  return (
    <Tree
      className={styles.treelabels}
      treeData={treeData}
      showIcon={false}
      blockNode={true}
      defaultExpandAll={true}
      autoExpandParent={true}
      switcherIcon={<DownOutlined />}
    />
  );
});
