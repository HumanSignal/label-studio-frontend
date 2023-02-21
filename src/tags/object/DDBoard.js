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

/**
 * components
 */
import DragDropBoard from '../../components/DragDropBoard/DragDropBoard';
import { getData } from '../../components/DragDropBoard/createData';

/**
 * @name DDBoard
 * @meta_title DDBoard Tag displays items that can be dragged and dropped between columns
 * @meta_description Customize Label Studio by displaying and sorting results for machine learning and data science projects.
 * @param {string} value Data field value containing JSON type for DDBoard
 * @param {string} [valueType] Value to define the data type in DDBoard
 */
const Model = types
  .model({
    type: 'ddboard',
    value: types.maybeNull(types.string),
    _value: types.frozen([]),
    valuetype: types.optional(types.string, 'json'),

  })
  .views(self => ({
    get dataSource() {
      return self._value;
    },
    get resultType() {
      return 'ddboard';
    },
    get valueType() {
      return 'ddboard';
    },
    get result() {
      return self.annotation.results.find(r => r.from_name === self);
    },
  }))
  .actions(self => ({
    updateValue: flow(function* () {
      //grabs data from the createData file, update code here when we want to use real data
      self._value = getData();
      yield Promise.resolve(true);
    }),
    needsUpdate() {

      if (self.annotation && !self.result) {
        self.annotation.createResult({}, { ddboard: [] }, self, self);
      }

    },
    updateResult(newData) {
      //check if result exists already, since only one instance of it can exist at a time

      if (self.result) {
        self.result.setValue(newData);
      }
      else {
        self.annotation.createResult({}, { ddboard: newData }, self, self);
      }
    },

  }));

const DDBoardModel = types.compose('DDBoardModel', Base, ProcessAttrsMixin, AnnotationMixin, Model);

const HtxDDBoard = inject('store')(
  observer(({ item }) => {
    return (
      <DragDropBoard inputData={item.dataSource} handleChange={item.updateResult} />
    );
  }),
);

Registry.addTag('ddboard', DDBoardModel, HtxDDBoard);
Registry.addObjectType(DDBoardModel);

export { HtxDDBoard, DDBoardModel };
