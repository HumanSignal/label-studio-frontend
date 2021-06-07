import React from "react";
import { Dropdown } from "antd";
import { observer } from "mobx-react";

import { SortAscendingOutlined } from "@ant-design/icons";

import "./Entities.scss";
import { RegionTree } from "./RegionTree";
import { LabelList } from "./LabelList";
import { SortMenu } from "./SortMenu";
import { Oneof } from "../../common/Oneof/Oneof";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import "./Entities.styl";
import { Button } from "../../common/Button/Button";

import {
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

export default observer(({ regionStore }) => {
  const { classifications, regions } = regionStore;
  const count = regions.length + (regionStore.view === "regions" ? classifications.length : 0);

  const toggleVisibility = e => {
    e.preventDefault();
    e.stopPropagation();
    regionStore.toggleVisibility();
  };

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
              ? `${count} Region${(count === 0 || count > 1) ? "s" : ""}`
              : regionStore.view === "labels"
                ? "Labels"
                : null}
          </Elem>

          <Space size="small" align="end">
            {regions.length > 0 ? (
              <Elem
                name="visibility"
                tag={Button}
                size="small"
                type="link"
                onClick={toggleVisibility}
                mod={{hidden: regionStore.isAllHidden}}
                icon={regionStore.isAllHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              />
            ) : null}

            {regionStore.view === "regions" && count > 0 && (
              <Dropdown overlay={<SortMenu regionStore={regionStore} />} placement="bottomLeft">
                <Elem name="sort" onClick={e => e.preventDefault()}>
                  <SortAscendingOutlined /> Sort
                </Elem>
              </Dropdown>
            )}
          </Space>
        </Space>
      </Elem>

      <Oneof value={regionStore.view}>
        <Elem name="regions" case="regions">
          {count ? <RegionTree regionStore={regionStore} /> : <Elem name="empty">No Regions created yet</Elem>}
        </Elem>
        <Elem name="labels" case="labels">
          {count ? <LabelList regionStore={regionStore} /> : <Elem name="empty">No Labeled Regions created yet</Elem>}
        </Elem>
      </Oneof>
    </Block>
  );
});
