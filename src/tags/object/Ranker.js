/**
 * libraries
 */
import React from 'react';
import { inject, observer } from 'mobx-react';
import { flow, types } from 'mobx-state-tree';

import Registry from '../../core/Registry';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import ProcessAttrsMixin from '../../mixins/ProcessAttrs';
import Base from './Base';
import { parseValue } from '../../utils/data';

/**
 * components
 */
import Ranker from '../../components/Ranker/Ranker';
import { getData } from '../../components/Ranker/createData';

/**
 * @name Ranker
 * @meta_title Ranker Tag displays items that can be dragged and dropped between columns
 * @meta_description Customize Label Studio by displaying and sorting results for machine learning and data science projects.
 * @param {string} value Data field value containing JSON type for Ranker
 * @param {string} [valueType] Value to define the data type in Ranker
 */
const Model = types
  .model({
    type: 'ranker',
    value: types.maybeNull(types.string),
    _value: types.frozen([]),
    valuetype: types.optional(types.string, 'json'),
    /**
     * rank: 1 column, reorder to rank
     * select: 2 columns, drag results to second column to select
     */
    mode: types.optional(types.enumeration(['rank', 'select']), 'select'),

  })
  .views(self => ({
    get dataSource() {
      return self._value;
    },
    get resultType() {
      return 'ranker';
    },
    get valueType() {
      return 'ranker';
    },
    get result() {
      return self.annotation.results.find(r => r.from_name === self);
    },
  }))
  .actions(self => ({
    updateValue: flow(function* (store) {
      const value = parseValue(self.value, store.task.dataObj);

      //grabs data from the createData file
      self._value = getData(value, self.mode);
      yield Promise.resolve(true);
    }),
    needsUpdate() {
      if (self.annotation && !self.result) {
        self.annotation.createResult({}, { ranker: [] }, self, self);
      }

    },
    updateResult(newData) {
      //check if result exists already, since only one instance of it can exist at a time
      if (self.result) {
        self.result.setValue(newData);
      } else {
        self.annotation.createResult({}, { ranker: newData }, self, self);
      }
    },
  }));

const RankerModel = types.compose('RankerModel', Base, ProcessAttrsMixin, AnnotationMixin, Model);

const HtxRanker = inject('store')(
  observer(({ item }) => {
    return (
      <Ranker inputData={item.dataSource} handleChange={item.updateResult} />
    );
  }),
);

Registry.addTag('ranker', RankerModel, HtxRanker);
Registry.addObjectType(RankerModel);

export { HtxRanker, RankerModel };
