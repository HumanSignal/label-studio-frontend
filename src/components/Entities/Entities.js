import React from "react";
import { Dropdown } from "antd";
import { observer } from "mobx-react";

import "./Entities.scss";
import { RegionTree } from "./RegionTree";
import { LabelList } from "./LabelList";
import { SortMenu, SortMenuIcon, SortMenuTitle } from "./SortMenu";
import { Oneof } from "../../common/Oneof/Oneof";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import "./Entities.styl";
import { Button } from "../../common/Button/Button";
import { LsInvisible, LsVisible } from "../../assets/icons";

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
          <RadioGroup.Button value="regions">Regions{count ? <Elem name="counter">&nbsp;{count}</Elem> : null}</RadioGroup.Button>
          <RadioGroup.Button value="labels">Labels</RadioGroup.Button>
        </RadioGroup>
      </Elem>

      {count ? <Elem name="header">
        <Space spread align={regionStore.view === "regions" ? null : "end"}>
          {regionStore.view === "regions"  && <Dropdown overlay={<SortMenu regionStore={regionStore}/>} placement="bottomLeft">
            <Elem name="sort" onClick={e => e.preventDefault()}>
              <Elem name="sort-icon"><SortMenuIcon sortKey={regionStore.sort}/></Elem> {`Sorted by ${regionStore.sort[0].toUpperCase()}${regionStore.sort.slice(1)}`}
            </Elem>
          </Dropdown>}

          <Space size="small" align="end">
            {regions.length > 0 ? (
              <Elem
                name="visibility"
                tag={Button}
                size="small"
                type="link"
                onClick={toggleVisibility}
                mod={{ hidden: regionStore.isAllHidden }}
                icon={regionStore.isAllHidden ? <LsInvisible/> : <LsVisible/>}
              />
            ) : null}


          </Space>
        </Space>
      </Elem>
        : null}

      <Oneof value={regionStore.view}>
        <Elem name="regions" case="regions">
          {count ? <RegionTree regionStore={regionStore}/> : <Elem name="empty">No Regions created yet</Elem>}
        </Elem>
        <Elem name="labels" case="labels">
          {count ? <LabelList regionStore={regionStore}/> : <Elem name="empty">No Labeled Regions created yet</Elem>}
        </Elem>
      </Oneof>
    </Block>
  );
});
