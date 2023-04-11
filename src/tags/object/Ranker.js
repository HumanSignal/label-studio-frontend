/**
 * libraries
 */
import React from 'react';
import { inject, observer } from 'mobx-react';
import { types } from 'mobx-state-tree';

import Registry from '../../core/Registry';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import ProcessAttrsMixin from '../../mixins/ProcessAttrs';
import Base from './Base';
import { parseValue } from '../../utils/data';

/**
 * components
 */
import Ranker from '../../components/Ranker/Ranker';
import { transformData } from '../../components/Ranker/createData';

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
    title: types.optional(types.string, ''),

  })
  .views(self => ({
    get dataSource() {
      const data = self._value;
      // if result was not created yet, return data as is
      const result = self.result?.value.ranker;
      let columns = [];

      if (self.mode === 'rank') {
        columns = result
          ? [result.map(id => data.find(d => d.id === id))]
          : [data];
      } else {
        columns = result
          ? [
            data.filter(d => !result.includes(d.id)),
            result.map(id => data.find(d => d.id === id)),
          ]
          : [data, []];
      }
      //grabs data from the createData file
      return transformData(columns, self.title.split('|'));
    },
    get result() {
      return self.annotation?.results.find(r => r.from_name === self);
    },
    get resultType() {
      return 'ranker';
    },
    get valueType() {
      return 'ranker';
    },
    isReadOnly() {
      // tmp fix for infinite recursion in isReadOnly() in ReadOnlyMixin
      // should not affect anything, this object is self-contained
      return true;
    },
  }))
  .actions(self => ({
    updateValue(store) {
      const value = parseValue(self.value, store.task.dataObj);

      if (!Array.isArray(value)) return;

      self._value = value;
    },

    createResult(data) {
      self.annotation.createResult({}, { ranker: data }, self, self);
    },

    updateResult(newData) {
      // check if result exists already, since only one instance of it can exist at a time
      if (self.result) {
        self.result.setValue(newData);
      } else {
        self.createResult(newData);
      }
    },

    // Create result on submit if it doesn't exist
    beforeSend() {
      if (self.result) return;

      if (self.mode === 'rank') {
        self.createResult(self._value.map(item => item.id));
      } else {
        self.createResult([]);
      }
    },
  }));

const RankerModel = types.compose('RankerModel', Base, ProcessAttrsMixin, AnnotationMixin, Model);

const HtxRanker = inject('store')(
  observer(({ item }) => {
    const data = item.dataSource;

    if (!data) return null;

    return (
      <Ranker inputData={data} handleChange={item.updateResult} />
    );
  }),
);

Registry.addTag('ranker', RankerModel, HtxRanker);
Registry.addObjectType(RankerModel);

export { HtxRanker, RankerModel };
