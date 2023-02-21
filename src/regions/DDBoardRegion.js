import { types } from 'mobx-state-tree';

import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';
import { DDBoardModel } from '../tags/object';
import { guidGenerator } from '../core/Helpers';
import Registry from '../core/Registry';
import { AreaMixin } from '../mixins/AreaMixin';
import { AnnotationMixin } from '../mixins/AnnotationMixin';

const Model = types
  .model('DDBoardRegionModel', {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: 'ddboardregion',
    object: types.late(() => types.reference(DDBoardModel)),
    items: types.array(types.string),
  })
  .volatile(() => ({
    hideable: true,
  }))
  .views(self => ({
    get parent() {
      return self.object;
    },

  }))
  .actions(self => ({

    serialize() {
      //just to silence console warning
      console.log(self);
      return {};
    },
  }));

const DDBoardRegionModel = types.compose(
  'DDBoardRegionModel',
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  AnnotationMixin,
  Model,
);

Registry.addRegionType(DDBoardRegionModel, 'ddboard');

export { DDBoardRegionModel };
