import { types } from 'mobx-state-tree';

import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';
import { RankerBoardModel } from '../tags/object';
import { guidGenerator } from '../core/Helpers';
import Registry from '../core/Registry';
import { AreaMixin } from '../mixins/AreaMixin';
import { AnnotationMixin } from '../mixins/AnnotationMixin';

const Model = types
  .model('RankerBoardRegionModel', {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: 'rankerboardregion',
    object: types.late(() => types.reference(RankerBoardModel)),
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
      //TODO remove
      console.log(self);
      return {};
    },
  }));

const RankerBoardRegionModel = types.compose(
  'RankerBoardRegionModel',
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  AnnotationMixin,
  Model,
);

Registry.addRegionType(RankerBoardRegionModel, 'rankerboard');

export { RankerBoardRegionModel };
