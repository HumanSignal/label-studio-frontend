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

      // New scale ratios
      const scaleX = obj.naturalWidth / obj.stageWidth;
      const scaleY = obj.naturalHeight / obj.stageHeight;

      const foundBboxes = getRoot(self.annotation).task.getTextFromBbox(value.x * scaleX, value.y * scaleY, value.width * scaleX, value.height * scaleY);

      if (foundBboxes && foundBboxes.length > 0) {

        foundBboxes.forEach(bbox => {

          const area = {
            textAnnotation: bbox.textAnnotation,
            x: bbox.area.x / scaleX,
            y: bbox.area.y / scaleY,
            width: bbox.area.width / scaleX,
            height: bbox.area.height / scaleY,
            rotation: obj.rotation,
            coordstype: "px",
          };

          const bboxNewArea = self.annotation.createResult(area, {}, control, obj, bbox.description);

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