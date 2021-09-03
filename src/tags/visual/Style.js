import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";

import Registry from "../../core/Registry";

/**
 * Use the Style tag in combination with the View tag to apply CSS properties to the labeling interface. See the [CSS Reference](https://www.w3schools.com/cssref/default.asp) on the W3Schools page for a full list of available properties that you can reference.
 *  
 * @example
 * <!-- Use CSS styling to make a header appear with a red background on the labeling interface -->
 * <View>
 *   <Style> .cls-name { background: red; }</Style>
 *   <View className="cls-name">
 *     <Header value="Header" />
 *   </View>
 * </View>
 * @example
 * <!-- Use CSS styling to make a header appear centered with a dotted blue border while the task is unstyled -->
 * <View>
 *   <Style> .fancy-border { border: 4px dotted blue; text-align: center; }</Style>
 *   <View className="fancy-border">
 *     <Header value="Greatest Task Header of All Time" />
 *   </View>
 *   <View>
 *     <Text name="text" value="$value"/>
 *     <Choices name="other" toName="text" choice="single">
 *       <Choice value="Other"/>
 *       <Choice value="Other2"/>
 *     </Choices>
 *   </View>
 * </View>
 * @example
 * <!-- Use CSS styling to wrap a text classification task with a green dotted border with 35px of padding, apply a green shadow to all text, align all text in the center -->
 * <View>
 * <Style> .fancy-choices { outline: 5px dotted green; padding: 35px; text-shadow: 2px 2px green; text-align: center; } </Style>
 *   <View className="fancy-choices">
 *     <Text name="text" value="$value"/>
 *     <Choices name="other" toName="text" choice="single">
 *       <Choice value="Other"/>
 *        <Choice value="Other2"/>
 *     </Choices>
 *   </View>
 * </View>
 * @name Style
 * @meta_title Style Tag to use CSS Styles
 * @meta_description Customize Label Studio with CSS styles to modify the labeling interface for machine learning and data science projects.
 * @param {string} .<className>    - Reference the className specified in the View tag to apply to a section of the labeling configuration.
 * @param {string} [CSS property]  - CSS property and value to apply.
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
