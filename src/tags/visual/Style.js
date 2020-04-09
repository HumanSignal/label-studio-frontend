import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";

import Registry from "../../core/Registry";

/**
 * Style tag, add css styles right through the config
 * @example
 * <View>
 *   <Style> .cls-name { background: red; }</Style>
 *   <View className="cls-name">
 *     <Header value="Header" />
 *   </View>
 * </View>
 * @name Style
 */
const Model = types.model({
  type: "style",
  value: types.optional(types.string, ""),
});
const StyleModel = types.compose("StyleModel", Model);

const HtxStyle = observer(({ item }) => {
  return <style dangerouslySetInnerHTML={{ __html: item.value }}></style>;
});

Registry.addTag("style", StyleModel, HtxStyle);

export { HtxStyle, StyleModel };
