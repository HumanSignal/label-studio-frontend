import styles from "./Entities.module.scss";
import { Tree } from "antd";
import { LabelItem } from "./LabelItem";
import { RegionItem } from "./RegionItem";
import { observer } from "mobx-react";
import { LsChevron } from "../../assets/icons";

export const LabelList = observer(({ regionStore }) => {
  const treeData = regionStore.asLabelsTree((item, idx, isLabel, children, onClick) => {
    return {
      key: item.id,
      title: (data) => {
        return isLabel ? (
          <LabelItem item={item} idx={idx} regions={data.children} regionStore={regionStore} />
        ) : (
          <RegionItem item={item} idx={idx} onClick={onClick}/>
        );
      },
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
      switcherIcon={<LsChevron opacity="0.25" />}
    />
  );
});
