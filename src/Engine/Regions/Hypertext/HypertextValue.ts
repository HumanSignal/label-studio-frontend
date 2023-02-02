import { ResultValueType } from 'src/Engine/Regions/RegionValue';
import { TextValue } from '../Text/TextValue';

export class HypertextValue extends TextValue {
  static type = ResultValueType.hypertext;

  export() {
    return {
      ...this.exportResult(),
      hypertextlabels: this.properties.hypertextlabels!,
    };
  }
}
