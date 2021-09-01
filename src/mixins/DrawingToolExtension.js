import { types, getRoot } from "mobx-state-tree";
import Area from "../regions/Area";

export const DrawingToolExtension = types.model().actions(self => ({

  commitDrawingRegion() {
    const { currentArea, control, obj } = self;

    const source = currentArea.toJSON();
    const value = Object.keys(currentArea.serialize().value).reduce((value, key) => {
      value[key] = source[key];
      return value;
    }, { coordstype: "px" });

    let newArea;

    if (control.gettextfromocr) {
      const foundBboxes = getRoot(self.annotation).task.getTextFromBbox(value.x, value.y, value.width, value.height);

      if (foundBboxes && foundBboxes.length > 0) {

        foundBboxes.forEach(bbox => {

          const bboxNewArea = self.annotation.createResult(bbox.area, {}, control, obj, bbox.description);

          self.applyActiveStates(bboxNewArea);
          newArea = bboxNewArea;
        });
      }
        
      self.deleteRegion();
    } else {
      newArea = self.annotation.createResult(value, currentArea.results[0].value.toJSON(), control, obj);

      self.applyActiveStates(newArea);
      self.deleteRegion();
    }

    return Area;
  },
    
}));