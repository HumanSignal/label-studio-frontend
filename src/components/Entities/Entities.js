import React from "react";
import { Dropdown } from "antd";
import { observer } from "mobx-react";

import { SortAscendingOutlined } from "@ant-design/icons";

import "./Entities.scss";
import globalStyles from "../../styles/global.module.scss";
import { RegionTree } from "./RegionTree";
import { LabelList } from "./LabelList";
import { SortMenu } from "./SortMenu";
import { Oneof } from "../../common/Oneof/Oneof";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import "./Entities.styl";

export default observer(({ regionStore }) => {
  const { classifications, regions } = regionStore;
  const count = regions.length + (regionStore.view === "regions" ? classifications.length : 0);

  return (
    <Block name="entities">
      <Elem name="source">
        <RadioGroup
          size="small"
          value={regionStore.view}
          onChange={e => {
            regionStore.setView(e.target.value);
          }}
        >
          <RadioGroup.Button value="regions">Regions</RadioGroup.Button>
          <RadioGroup.Button value="labels">Labels</RadioGroup.Button>
        </RadioGroup>
      </Elem>

      <Elem name="header">
        <Space spread>
          <Elem name="title">
            {regionStore.view === "regions"
              ? `${count} Region${count > 1 ? "s" : ""}`
              : regionStore.view === "labels"
                ? "Labels"
                : null}
          </Elem>

          {regionStore.view === "regions" && count > 0 && (
            <Dropdown overlay={<SortMenu regionStore={regionStore} />} placement="bottomLeft">
              <Elem name="sort" onClick={e => e.preventDefault()}>
                <SortAscendingOutlined /> Sort
              </Elem>
            </Dropdown>
          )}
        </Space>
      </Elem>

      <Oneof value={regionStore.view}>
        <div case="regions">{count ? <RegionTree regionStore={regionStore} /> : <p>No Regions created yet</p>}</div>
        <div case="labels">
          {count ? <LabelList regionStore={regionStore} /> : <p>No Labeled Regions created yet</p>}
        </div>
      </Oneof>
    </Block>
  );
});
