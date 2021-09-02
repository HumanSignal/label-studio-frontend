import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";

import Registry from "../../core/Registry";

/**
 * Use the Style tag inside the View tag to apply CSS styles to the labeling interface.
 *  
 * @example
 * <!-- Add CSS styles to a header on the labeling interface -->
 * <View>
 *   <Style> .cls-name { background: red; }</Style>
 *   <View className="cls-name">
 *     <Header value="Header" />
 *   </View>
 * </View>
 * @name Style
 * @meta_title Style Tag to use CSS Styles
 * @meta_description Customize Label Studio with CSS styles to modify the labeling interface for machine learning and data science projects.
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
