import React from "react";
import { Table } from "antd";
import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import Registry from "../../core/Registry";

/**
 * Table tag, show object keys and values in a table
 * @example
 * <View>
 *   <Table name="text-1" value="$text"></Table>
 * </View>
 * @name Table
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

    console.log(item._value);
    console.log(Object.keys(value));

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
