import { types } from 'mobx-state-tree';
import { FF_DEV_3391, isFF } from '../../utils/feature-flags';
import { BaseTag } from '../TagBase';

const ControlBase = types.model({
  ...(isFF(FF_DEV_3391)
    ? {
      id: types.identifier,
      name: types.string,
    } : {
      name: types.identifier,
    }),
  smart: true,
  smartonly: false,
  isControlTag: true,
}).views(self => ({
  // historically two "types" were used and we should keep that backward compatibility:
  // 1. name of control tag for describing labeled region;
  // 2. label type to attach corresponding value to this region.
  // usually they are the same, but with some problems:
  // a. for hypertextlabels label type should be "htmllabels";
  // original type are overwritten by Tree#buildData with real tag name,
  // so _type was introduced to contain desired result type;
  // b. but for textarea they differ from each other: "textarea" and "text".
  // so now there is simple way to distinguish and overwrite them via two methods:
  get resultType() {
    return self.type;
  },

  // and
  get valueType() {
    return self.type;
  },
}));

export default types.compose(ControlBase, BaseTag);
