import React, { useState } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Konva from "konva";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

import { Tool } from "../components/Toolbar/Tool";
//import { Range } from "../common/Range/Range";
import { FilterOutlined } from "@ant-design/icons";
import { Col, Collapse, Empty, Form, Modal, Row, Select } from "antd";
import { SettingOutlined } from '@ant-design/icons';

const FilterView = observer(({ item }) => {
  const [modalVisible, setModelVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [form] = Form.useForm();

  const OPTIONS = Object.keys(Konva.Filters);
  const handleChange = selectedItems => {
    setSelectedItems(selectedItems);
  };
  const filteredOptions = OPTIONS.filter(o => !selectedItems.includes(o));
  const genExtra = () => (
    <SettingOutlined
      onClick={event => {
        // If you don't want click extra trigger collapse, you can prevent this:
        event.stopPropagation();
      }}
    />
  );

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
        title="Filter Settings"
        centered
        visible={modalVisible}
        onOk={() => {
          item.setFilters(selectedItems);
          item.setFiltersEnabled(selectedItems.length > 0);
          setModelVisible(false);
        }}
        onCancel={() => setModelVisible(false)}
      >
        <Row>
          <Col span={24}>
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item label="Select Filters" name="selectFilters">
                <Select
                  key="filters"
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
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
              </Form.Item>
              <Form.Item label="Configure Filters" name="configureFilters">
                {selectedItems.length > 0 ? (
                  <Collapse
                    defaultActiveKey={selectedItems[0]}
                    // expandIconPosition={'left'}
                    accordion
                  >
                    {selectedItems.map(item => (
                      <Collapse.Panel header={`${item} Settings`} key={item} extra={genExtra()}>
                        <div>{item}</div>
                        <p>TODO: Render options...</p>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                ) : (<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />)}
              </Form.Item>
            </Form>
          </Col>
        </Row>
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
