import { types } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import Types from "../../core/Types";
import ControlBase from "./Base";
import { customTypes } from "../../core/CustomTypes";

/**
 * KeyPoint is used to add a keypoint to an image without label selection. It's useful when you have only one label.
 * @example
 * <View>
 *   <KeyPoint name="kp-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name KeyPoint
 * @param {string} name                  - name of the element
 * @param {string} toName                - name of the image to label
 * @param {float=} [opacity=0.9]         - opacity of keypoint
 * @param {string=} [fillColor=#8bad00]  - keypoint fill color
 * @param {number=} [strokeWidth=1]      - width of the stroke
 * @param {string=} [stokeColor=#8bad00] - keypoint stroke color
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  opacity: types.optional(customTypes.range(), "0.9"),
  fillcolor: types.optional(customTypes.color, "#8bad00"),

  strokecolor: types.optional(customTypes.color, "#8bad00"),
  strokewidth: types.optional(types.string, "1"),
});

const Model = types
  .model({
    type: "keypoint",

    // tools: types.array(BaseTool)
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get completion() {
      return Types.getParentOfTypeString(self, "Completion");
    },
  }))
  .actions(self => ({
    fromStateJSON(obj) {},

    afterCreate() {
      const kp = Tools.KeyPoint.create();
      kp._control = self;

      self.tools = { keypoint: kp };
    },
  }));

const KeyPointModel = types.compose("KeyPointModel", TagAttrs, Model, ControlBase);

const HtxView = () => {
  return null;
};

Registry.addTag("keypoint", KeyPointModel, HtxView);

export { HtxView, KeyPointModel };
