import { types } from 'mobx-state-tree';

import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';
import { RankerModel } from '../tags/object';
import { guidGenerator } from '../core/Helpers';
import Registry from '../core/Registry';
import { AreaMixin } from '../mixins/AreaMixin';
import { AnnotationMixin } from '../mixins/AnnotationMixin';

const Model = types
  .model('RankerRegionModel', {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: 'rankerregion',
    object: types.late(() => types.reference(RankerModel)),
  })
  .volatile(() => ({
    hideable: true,
  }))
  .views(self => ({
    get parent() {
      return self.object;
    },

  }))
  .actions(() => ({

    serialize() {
      return {};
    },
  }));

const RankerRegionModel = types.compose(
  'RankerRegionModel',
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  AnnotationMixin,
  Model,
);

Registry.addRegionType(RankerRegionModel, 'ranker');

export { RankerRegionModel };
