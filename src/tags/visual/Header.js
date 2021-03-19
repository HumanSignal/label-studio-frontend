import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Typography } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";

/**
 * Use the Header tag to show a header.
 * @example
 * <View>
 *   <Header name="text-1" value="$text" />
 * </View>
 * @example
 * <View>
 *   <Header name="text-1" value="Please select the class" />
 * </View>
 * @name Header
 * @param {string} value              - Text of header
 * @param {number} [size=4]           - Size of header
 * @param {string} [style]            - CSS style string
 * @param {boolean} [underline=false] - Whether to underline the header
 */
const Model = types.model({
  type: "header",
  size: types.optional(types.string, "4"),
  style: types.maybeNull(types.string),
  _value: types.optional(types.string, ""),
  value: types.optional(types.string, ""),
  underline: types.optional(types.boolean, false),
});

const HeaderModel = types.compose("HeaderModel", Model, ProcessAttrsMixin);

const HtxHeader = observer(({ item }) => {
  const size = parseInt(item.size);
  const style = item.style ? Tree.cssConverter(item.style) : { margin: "10px 0" };

  if (!style.fontSize && size > 4) {
    style.fontSize = size === 5 ? "1.2em" : "1.1em";
  }

  return (
    <Typography.Title underline={item.underline} level={size} style={style}>
      {item._value}
    </Typography.Title>
  );
});

Registry.addTag("header", HeaderModel, HtxHeader);

export { HtxHeader, HeaderModel };
