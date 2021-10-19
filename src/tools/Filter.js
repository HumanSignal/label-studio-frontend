import React, { useState } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Konva from "konva";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

import { Tool } from "../components/Toolbar/Tool";
//import { Range } from "../common/Range/Range";
import { FilterOutlined } from "@ant-design/icons";
import { Collapse, Empty, Modal, Panel, Select } from "antd";

const FilterView = observer(({ item }) => {
  const [modalVisible, setModelVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const OPTIONS = Object.keys(Konva.Filters);
  const handleChange = selectedItems => {
    setSelectedItems(selectedItems);
  };
  const filteredOptions = OPTIONS.filter(o => !selectedItems.includes(o));

  return (
    <>
      <Tool
        active={item.selected}
        icon={<FilterOutlined />}
        ariaLabel="filter"
        label="Filter"
        shortcut="F"
        onClick={() => {
          //const sel = item.selected;
          setModelVisible(true);
          //item.setMode(sel);
        }} />
      <Modal
        title="Vertically centered modal dialog"
        centered
        visible={modalVisible}
        onOk={() => {
          item.setFilters(selectedItems);
          item.setFiltersEnabled(selectedItems.length() > 0);
          setModelVisible(false);
        }}
        onCancel={() => setModelVisible(false)}
      >
        <Select
          key="filters"
          mode="multiple"
          allowClear
          placeholder="Please select filter(s)"
          value={selectedItems}
          onChange={handleChange}
        >
          {filteredOptions.map(item => (
            <Select.Option key={item} value={item}>
              {item}
            </Select.Option>
          ))}
        </Select >
        {selectedItems.length() > 0 ? (
          <Collapse
            defaultActiveKey={selectedItems[0]}
            // expandIconPosition={'left'}
            accordion
          >
            {selectedItems.map(item => (
              <Panel header={item} key={item}>
                <div>{item}</div>
                <p>Render options...</p>
              </Panel>
            ))}
          </Collapse>
        ) : (<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />)}
      </Modal>
    </>
  );
});

const _Filter = types
  .model("FilterTool", {
    filters: types.optional(types.array(types.string), []),
    filtersEnabled: types.optional(types.boolean, false),
    //filterProperties: types.optional(types.map(types.custom), []),
  })
  .views(self => ({
    get viewClass() {
      return () => <FilterView item={self} />;
    },
  }))
  .actions(self => ({
    setFilters(val) {
      self.filters = val;
      self.obj.setFilters(val);
    },
    setFiltersEnabled(val) {
      self.filtersEnabled = val;
      self.obj.setFiltersEnabled(val);
    },
    // setFilterProperties(val) {
    //   self.filterProperties = val;
    //   self.obj.setFilterProperties(val);
    // },
  }));

const Filter = types.compose(_Filter.name, ToolMixin, BaseTool, _Filter);

export { Filter };
