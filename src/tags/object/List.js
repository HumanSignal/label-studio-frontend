import React from 'react';
import { inject, observer } from 'mobx-react';
import { types } from 'mobx-state-tree';

import Ranker from '../../components/Ranker/Ranker';
import Registry from '../../core/Registry';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import ProcessAttrsMixin from '../../mixins/ProcessAttrs';
import { parseValue } from '../../utils/data';
import Base from './Base';

/**
 * The `List` tag is used to rank items in a list or pick relevant items from a list, depending on `mode` parameter. Task data referred in `value` parameter should be an array of objects with `id`, `title`, and `body` fields.
 * Results are saved as an array of `id`s in `result` field.
 * Columns and items can be styled in `Style` tag by using respective `.htx-ranker-column` and `.htx-ranker-item` classes. Titles of one or two columns are defined in single `title` parameter.
 * @example
 * <!-- Visual appearance can be changed via Style tag with these classnames -->
 * <View>
 *   <Style>
 *     .htx-ranker-column { background: cornflowerblue; }
 *     .htx-ranker-item { background: lightgoldenrodyellow; }
 *   </Style>
 *   <List name="ranker" value="$items" mode="rank" title="Search Results"/>
 * </View>
 * @example
 * <!-- Example data and result for List tag -->
 * {
 *   "items": [
 *     { "id": "blog", "title": "10 tips to write a better function", "body": "There is nothing worse than being left in the lurch when it comes to writing a function!" },
 *     { "id": "mdn", "title": "Arrow function expressions", "body": "An arrow function expression is a compact alternative to a traditional function" },
 *     { "id": "wiki", "title": "Arrow (computer science)", "body": "In computer science, arrows or bolts are a type class..." },
 *   ]
 * }
 * {
 *   "from_name": "ranker",
 *   "to_name": "ranker",
 *   "type": "ranker",
 *   "value": { "ranker": ["mdn", "wiki", "blog"] }
 * }
 * @name List
 * @meta_title List Tag displays items that can be dragged and dropped between columns
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
    title: types.optional(types.string, ''),
  })
  .views(self => ({
    get ranker() {
      return self.annotation.toNames.get(self.name)?.filter(t => t.type === 'ranker');
    },
    // index of all items from _value
    get items() {
      return Object.fromEntries(self._value.map(item => [item.id, item]));
    },
  }))
  .views(self => ({
    get dataSource() {
      return {
        items: self.items,
        columns: [{ id: self.name }],
        itemIds: { [self.name]: Object.keys(self.items) },
      };
    },
    get result() {
      return self.annotation?.results.find(r => r.from_name === self);
    },
  }))
  .actions(self => ({
    updateValue(store) {
      const value = parseValue(self.value, store.task.dataObj);

      if (!Array.isArray(value)) return;

      self._value = value;
    },
  }));

const ListModel = types.compose('ListModel', Base, ProcessAttrsMixin, AnnotationMixin, Model);

const HtxList = inject('store')(
  observer(({ item }) => {
    const data = item.dataSource;

    if (!data) return null;
    // Ranker tag will display all items in interactive mode
    if (item.ranker) return null;

    return (
      <React.StrictMode>
        <Ranker inputData={data} readonly />
      </React.StrictMode>
    );
  }),
);

Registry.addTag('list', ListModel, HtxList);
Registry.addObjectType(ListModel);

export { HtxList, ListModel };
