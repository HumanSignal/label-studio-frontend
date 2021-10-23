import React, { useState } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Konva from "konva";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

import { Tool } from "../components/Toolbar/Tool";
import { FilterOutlined } from "@ant-design/icons";
import {
  AutoComplete,
  Col,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
  Typography
} from "antd";
import { SettingOutlined } from "@ant-design/icons";
const { Title } = Typography;

const FilterOptions = {
  Blur: [
    {
      name: "blurRadius",
      type: types.integer,
      default: 0,
    },
  ],
  Brighten: [
    {
      name: "brightness",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
  ],
  Contrast: [
    {
      name: "contrast",
      type: types.integer,
      default: 0,
      min: -100,
      max: 100,
    },
  ],
  Emboss: [
    {
      name: "embossStrength",
      type: types.number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    {
      name: "embossWhiteLevel",
      type: types.number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    {
      name: "embossDirection",
      type: types.string,
      default: "top-left",
      options: ["top-left", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left"],
    },
    {
      name: "embossBlend",
      type: types.boolean,
      default: false,
    },
  ],
  Enhance: [
    {
      name: "enhance",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
  ],
  Grayscale: null,
  HSL: [
    {
      name: "hue",
      type: types.integer,
      default: 0,
      min: 0,
      max: 359,
    },
    {
      name: "saturation",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
    {
      name: "luminance",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
  ],
  HSV: [
    {
      name: "hue",
      type: types.integer,
      default: 0,
      min: 0,
      max: 359,
    },
    {
      name: "saturation",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
    {
      name: "value",
      type: types.number,
      default: 0,
      min: -1,
      max: 1,
    },
  ],
  Invert: null,
  Kaleidoscope: [
    {
      name: "kaleidoscopePower",
      type: types.integer,
      default: 2,
    },
    {
      name: "kaleidoscopeAngle",
      type: types.number,
      default: 0,
    },
  ],
  Mask: [
    {
      name: "threshold",
      type: types.integer,
      default: 0,
    },
  ],
  Noise: [
    {
      name: "noise",
      type: types.number,
      default: 0.2,
      min: 0,
      max: 1,
    },
  ],
  Pixelate: [
    {
      name: "pixelSize",
      type: types.integer,
      default: 8,
    },
  ],
  Posterize: [
    {
      name: "levels",
      type: types.number,
      default: 0.5,
      min: 0,
      max: 1,
    },
  ],
  RGB: [
    {
      name: "red",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
    {
      name: "green",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
    {
      name: "blue",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
  ],
  RGBA: [
    {
      name: "red",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
    {
      name: "green",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
    {
      name: "blue",
      type: types.integer,
      default: 0,
      min: 0,
      max: 255,
    },
    {
      name: "alpha",
      type: types.integer,
      default: 1,
      min: 0,
      max: 1,
    },
  ],
  Sepia: null,
  Solarize: null,
  Threshold: [
    {
      name: "threshold",
      type: types.number,
      default: 0.5,
      min: 0,
      max: 1,
    },
  ],
};

const renderOption = (opt, updatePropFunc) => {
  switch (opt.type) {
    case types.boolean:
      return <Switch key={opt.name} defaultChecked={opt.default} onChange={val => updatePropFunc(opt.name, val)} />;
    case types.string:
      if (opt.options) {
        return (
          <AutoComplete
            allowClear
            options={opt.options.map(o => {
              return { value: o };
            })}
            placeholder={opt.default}
            defaultValue={opt.default}
            onChange={val => updatePropFunc(opt.name, val)}
          />
        );
      } else {
        return (
          <Input
            key={opt.name}
            placeholder={opt.default}
            allowClear
            defaultValue={opt.default}
            onChange={val => updatePropFunc(opt.name, val)}
          />
        );
      }
    case types.integer:
    case types.number:
      if (opt.min) {
        return (
          <InputNumber
            key={opt.name}
            keyboard={true}
            min={opt.min}
            max={opt.max}
            defaultValue={opt.default}
            onChange={val => updatePropFunc(opt.name, val)}
          />
        );
      } else {
        return (
          <InputNumber
            key={opt.name}
            keyboard={true}
            defaultValue={opt.default}
            onChange={val => updatePropFunc(opt.name, val)}
          />
        );
      }
    default:
      break;
  }
};

const genExtra = () => (
  <SettingOutlined
    onClick={event => {
      event.stopPropagation();
    }}
  />
);

const FilterView = observer(({ item }) => {
  const [modalVisible, setModelVisible] = useState(false);
  const [selectedFilters, setSelectedItems] = useState([]);
  const OPTIONS = Object.keys(Konva.Filters);
  let filterProperties = {};

  const handleChange = selectedItems => {
    setSelectedItems(selectedItems);
    // remove options for unselected
    const possiblePropKeys = selectedItems
      .filter(filter => FilterOptions[filter])
      .map(i => {
        return FilterOptions[i];
      })
      .flat()
      .map(opt => opt.name);
    const newProp = {};

    for (const [key, value] of Object.entries(filterProperties)) {
      if (possiblePropKeys.includes(key)) {
        newProp[key] = value;
      }
    }
    filterProperties = newProp;
    item.setFilterProperties(newProp);
  };
  const filteredOptions = OPTIONS.filter(o => !selectedFilters.includes(o));

  const updatePropFunc = (key, val) => {
    filterProperties[key] = val;
    item.setFilterProperties(filterProperties);
  };

  return (
    <>
      <Tool
        active={item.selected}
        icon={<FilterOutlined />}
        ariaLabel="filter"
        label="Filter"
        shortcut="F"
        onClick={() => {
          setModelVisible(true);
        }}
      />
      <Modal
        title="Filter Settings"
        centered
        visible={modalVisible}
        onOk={() => {
          item.setFilters(selectedFilters);
          item.setFiltersEnabled(selectedFilters.length > 0);
          setModelVisible(false);
        }}
        onCancel={() => setModelVisible(false)}
      >
        <Row>
          <Col span={24}>
            <Title level={4} label="Configure Filters" name="configureFilters">
              Configure Filters
            </Title>
          </Col>
          <Col span={24}>
            {selectedFilters.length > 0 && selectedFilters.some(s => FilterOptions[s]) ? (
              <Collapse accordion>
                {selectedFilters
                  .filter(filter => FilterOptions[filter])
                  .map(filter => (
                    <Collapse.Panel key={filter} header={`${filter} Settings`} extra={genExtra()}>
                      <Form
                        name={filter}
                        labelCol={{
                          span: 8,
                        }}
                        wrapperCol={{
                          span: 16,
                        }}
                        layout="horizontal"
                      >
                        {FilterOptions[filter].map(opt => (
                          <Form.Item key={opt.name} label={opt.name} name={opt.name}>
                            {renderOption(opt, updatePropFunc)}
                          </Form.Item>
                        ))}
                      </Form>
                    </Collapse.Panel>
                  ))}
              </Collapse>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<p>No filters selected</p>} />
            )}
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Title level={4} label="Select Filters" name="selectFilters">
              Select Filters
            </Title>
          </Col>
          <Col span={24}>
            <Select
              key="filters"
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Please select filter(s)"
              value={selectedFilters}
              onChange={handleChange}
            >
              {filteredOptions.map(item => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Modal>
    </>
  );
});

const _Filters = types
  .model("FiltersTool", {
    filters: types.optional(types.array(types.string), []),
    filtersEnabled: types.optional(types.boolean, false),
    filterProperties: types.optional(
      types.map(types.union(types.boolean, types.string, types.number, types.integer)),
      {},
    ),
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
    setFilterProperties(val) {
      self.filterProperties = val;
      self.obj.setFilterProperties(val);
    },
  }));

const Filters = types.compose(_Filters.name, ToolMixin, BaseTool, _Filters);

export { Filters };
