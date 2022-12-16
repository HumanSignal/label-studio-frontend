import { types } from 'mobx-state-tree';
import { isDefined } from '../utils/utilities';

const BaseTag = types
  .model('BaseTag')
  .views((self) => ({
    /**
     * Identify classification type tags
     *
     * `perRegionVisible` is only available for classification type tags
     */
    get isClassification() {
      return isDefined(self.perRegionVisible);
    },
  }));

export { BaseTag };
