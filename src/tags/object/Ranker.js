import React from 'react';
import { inject, observer } from 'mobx-react';
import { types } from 'mobx-state-tree';

import Registry from '../../core/Registry';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import ProcessAttrsMixin from '../../mixins/ProcessAttrs';
import { parseValue } from '../../utils/data';
import Base from './Base';

import Ranker from '../../components/Ranker/Ranker';
import { transformData } from '../../components/Ranker/createData';

/**
 * @name Ranker
 * The `Ranker` tag is used to rank items in a list or pick relevant items from a list, depending on `mode` parameter. Task data referred in `value` parameter should be an array of objects with `id`, `title`, and `body` fields.
 * Results are saved as an array of `id`s in `result` field.
 * Columns and items can be styled in `Style` tag by using respective `.htx-ranker-column` and `.htx-ranker-item` classes. Titles of one or two columns are defined in single `title` parameter.
 * @meta_title Ranker Tag displays items that can be dragged and dropped between columns
 * @meta_description Customize Label Studio by displaying and sorting results for machine learning and data science projects.
 * @param {string} value Data field containing a JSON with array of objects (id, title, body) to rank
 * @param {rank|select} [mode] rank: 1 column, reorder to rank, select: 2 columns, drag results to second column to select
 * @param {string} [title] Title(s) of the column(s), separate them by `|` symbol for `mode="select"
 */
const Model = types
  .model({
    type: 'ranker',
    value: types.maybeNull(types.string),
    _value: types.frozen([]),
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
      // transforms columns with data items into Ranker component format
      return transformData(columns, self.title.split('|'));
    },
    get result() {
      return self.annotation?.results.find(r => r.from_name === self);
    },
    get resultType() {
      // this tag isn't a control tag but behaves like one, 
      // so we we need to emulate `type`s logic to generate results.
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
