import React from "react";
import { Table } from "antd";
import { inject, observer } from "mobx-react";
import { flow, types } from "mobx-state-tree";
import Papa from "papaparse";

import Registry from "../../core/Registry";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Base from "./Base";
import { parseValue } from "../../utils/data";

/**
 * Use the Table tag to display object keys and values in a table.
 * @example
 * <!-- Basic labeling configuration for text in a table -->
 * <View>
 *   <Table name="text-1" value="$text"></Table>
 * </View>
 * @name Table
 * @meta_title Table Tag to Display Keys & Values in Tables
 * @meta_description Customize Label Studio by displaying key-value pairs in tasks for machine learning and data science projects.
 * @param {string} valuetype Value to define the data type in Table
 * @param {string} value Data field value containing JSON type for Table
 */
const Model = types.model({
  name: types.identifier,
  type: "table",
  value: types.maybeNull(types.string),
  _value: types.frozen([]),
  valuetype: types.optional(types.string, "json"),
}).views(self => ({
  get dataSource() {
    if(self.valuetype === 'json') {
      return Object.keys(self._value).map(k => {
        let val = self._value[k];

        if (typeof val === "object") val = JSON.stringify(val);
        return { type: k, value: val };
      });
    } else {
      return self._value;
    }
  },
  get columns() {
    if(self.valuetype === 'json' || !self._value[0]) {
      return [
        { title: "Name", dataIndex: "type" },
        { title: "Value", dataIndex: "value" },
      ];
    } else {
      return Object.keys(self._value[0]).map(value => ({ title: value, dataIndex: value }));
    }
  },
})).actions(self => ({
  updateValue: flow(function * (store) {
    // const options = ("csv|url|seperator=;").match(/^(\w+)(.)?/) ?? [];
    // const options = sep.s
    const [, type, sep] = self.valuetype.match(/^(\w+)(.)?/) ?? [];
    const options = {};

    if (sep) {
      const pairs = self.valuetype.split(sep).slice(1);

      pairs.forEach(pair => {
        const [k, v] = pair.split("=", 2);

        options[k] = v ?? true; // options without values are `true`
      });
    }

    switch (type) {
      case "csv":
        {
          let csvData = parseValue(self.value, store.task.dataObj);

          if (options.url) {
            const response = yield fetch(csvData);

            csvData = yield response.text();
          }
          
          Papa.parse(
            csvData,
            {
              delimiter: options.separator,
              header: !options.headless,
              download: false,
              complete: ({ data }) => {
                self._value = data;
              },
            },
          );
        }
        break;
      default:
        self._value = parseValue(self.value, store.task.dataObj);
        break;
    }
  }),
}));

const TableModel = types.compose("TableModel", Base, ProcessAttrsMixin, Model);

const HtxTable = inject("store")(
  observer(({ _, item }) => {
    return <Table bordered dataSource={item.dataSource} columns={item.columns} pagination={{ hideOnSinglePage: true }} />;
  }),
);

Registry.addTag("table", TableModel, HtxTable);
Registry.addObjectType(TableModel);

export { HtxTable, TableModel };
