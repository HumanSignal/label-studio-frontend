import React from "react";
import { Table } from "antd";
import { inject, observer } from "mobx-react";
import { getRoot, types } from "mobx-state-tree";

import Registry from "../../core/Registry";

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
 * @param {string} value
 */
const Model = types
  .model({
    type: "table",
    value: types.maybeNull(types.string),
    // _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get _value() {
      if (!self.value) return undefined;

      const store = getRoot(self);
      const val = self.value.substr(1);

      return store.task.dataObj[val];
    },
  }));

const TableModel = types.compose("TableModel", Model);

const HtxTable = inject("store")(
  observer(({ store, item }) => {
    let value = item._value;

    if (!value) {
      if (store.task) value = store.task.dataObj;
    }

    const columns = [
      { title: "Name", dataIndex: "type" },
      { title: "Value", dataIndex: "value" },
    ];

    const dataSource = Object.keys(value).map(k => {
      let val = value[k];

      if (typeof val === "object") val = JSON.stringify(val);

      return { type: k, value: val };
    });

    return <Table bordered dataSource={dataSource} columns={columns} pagination={{ hideOnSinglePage: true }} />;
  }),
);

Registry.addTag("table", TableModel, HtxTable);

export { HtxTable, TableModel };
