import { types, getEnv, isAlive } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";

export const AnnotationStoreExtension = types.model().actions(self => ({

  createResult(areaValue, resultValue, control, object, foundText) {
    const result = {
      from_name: control.name,
      to_name: object,
      type: control.resultType,
      value: resultValue,
    };

    let results;

    if (foundText) {

      const newResult = {
        from_name: 'transcription',
        to_name: 'image',
        type: 'textarea',
        value: {
          text: [
            foundText,
          ],
        },
      };

      results = [result, newResult];

    } else {
      results = [result];
    }

    const areaRaw = {
      id: guidGenerator(),
      object,
      // data for Model instance
      ...areaValue,
      // for Model detection
      value: areaValue,
      results,
    };

    const area = self.areas.put(areaRaw);

    if (!area.classification) getEnv(self).events.invoke('entityCreate', area);

    if (self.store.settings.selectAfterCreate) {
      if (!area.classification) {
        setTimeout(() => isAlive(area) && self.selectArea(area));
      }
    } else {
      // unselect labels after use, but consider "keep labels selected" settings
      if (control.type.includes("labels")) self.unselectAll(true);
    }

    return area;
  },

}),
);