import React from 'react';
import { inject, observer } from 'mobx-react';
import { types } from 'mobx-state-tree';

import Ranker from '../../components/Ranker/Ranker';
import Registry from '../../core/Registry';
import Tree from '../../core/Tree';
import Types from '../../core/Types';
import { AnnotationMixin } from '../../mixins/AnnotationMixin';
import { guidGenerator } from '../../utils/unique';
import Base from './Base';

/**
 * The `Ranker` tag is used to rank items in a list or pick relevant items from a list, depending on `mode` parameter. Task data referred in `value` parameter should be an array of objects with `id`, `title`, and `body` fields.
 * Results are saved as an array of `id`s in `result` field.
 * Columns and items can be styled in `Style` tag by using respective `.htx-ranker-column` and `.htx-ranker-item` classes. Titles of columns are defined in `title` parameter of `Bucket` tag.
 * @example
 * <!-- Visual appearance can be changed via Style tag with these predefined classnames -->
 * <View>
 *   <Style>
 *     .htx-ranker-column { background: cornflowerblue; }
 *     .htx-ranker-item { background: lightgoldenrodyellow; }
 *   </Style>
 *   <Ranker name="ranker" value="$items" mode="rank" title="Search Results"/>
 * </View>
 * @example
 * <!-- Example data and result for Ranker tag -->
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
 * @name Ranker
 * @meta_title Ranker Tag allows you to rank items in a List or, if Buckets are used, pick relevant items from a List
 * @meta_description Customize Label Studio by sorting results for machine learning and data science projects.
 * @param {string} name Name of the element
 * @param {string} toName List tag name to connect to
 */
const Model = types
  .model({
    type: 'ranker',
    toname: types.maybeNull(types.string),

    // @todo allow Views inside: ['bucket', 'view']
    children: Types.unionArray(['bucket']),
  })
  .volatile(() => ({
    leftInList: null,
  }))
  .views(self => ({
    get list() {
      const list = self.annotation.names.get(self.toname);

      return list.type === 'list' ? list : null;
    },
    get buckets() {
      return Tree.filterChildrenOfType(self, 'BucketModel');
    },
    /** @returns {string | undefined} */
    get useBucket() {
      return self.list?.useBucket;
    },
    get rankOnly() {
      return !self.buckets.length;
    },
    /** @returns {{ id: string, title: string }[]} */
    get columns() {
      if (!self.list) return [];
      if (self.rankOnly) return [{ id: self.name, title: self.list.title }];

      const columns = self.buckets.map(b => ({ id: b.name, title: b.title ?? '' }));

      if (!self.useBucket) columns.unshift({ id: '_', title: self.list.title });

      return columns;
    },
  }))
  .views(self => ({
    get dataSource() {
      const data = self.list?._value;
      const items = self.list?.items;
      const ids = Object.keys(items);
      const columns = self.columns;
      /** @type {{ [bucket: string]: string[] }} */
      const result = self.result?.value.ranker;
      let itemIds = {};

      console.log('PRE DATA', result, self.leftInList);

      if (!data) return [];
      // one array of items sitting in List tag, just reorder them if result is given
      if (self.rankOnly) {
        // 
        itemIds = { [self.name]: result ?? ids };
      } else if (!result) {
        itemIds = { [self.useBucket ?? '_']: ids };
      } else {
        itemIds = { ...result };

        if (!self.useBucket) {
          const selected = Object.values(result).flat();
          const left = self.leftInList ?? ids.filter(id => !selected.includes(id));
          // @todo what if data has more items then in selected bucket?

          itemIds['_'] = left;
        }
      }

      return { items, columns, itemIds };
    },
    get result() {
      return self.annotation?.results.find(r => r.from_name === self);
    },
    // isReadOnly() {
    //   // tmp fix for infinite recursion in isReadOnly() in ReadOnlyMixin
    //   // should not affect anything, this object is self-contained
    //   return true;
    // },
  }))
  .actions(self => ({
    createResult(data) {
      self.annotation.createResult({}, { ranker: data }, self, self.list);
    },

    updateResult(newData) {
      if (self.rankOnly) {
        newData = newData[self.name];
      } else if (newData._) {
        self.leftInList = newData._;
        delete newData._;
      }

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

      const ids = Object.keys(self.items);

      if (self.rankOnly) {
        self.createResult(ids);
      } else if (self.useBucket) {
        self.createResult({ [self.useBucket]: ids });
      }
    },
  }));

const RankerModel = types.compose('RankerModel', Base, AnnotationMixin, Model);

const HtxRanker = inject('store')(
  observer(({ item }) => {
    const data = item.dataSource;

    console.log('DATA', data);

    if (!data) return null;

    return (
      <Ranker inputData={data} handleChange={item.updateResult} />
    );
  }),
);

const BucketModel = types.model('BucketModel', {
  id: types.optional(types.identifier, guidGenerator),
  type: 'bucket',
  name: types.string,
  title: types.maybeNull(types.string),
});

const HtxBucket = inject('store')(observer(({ item }) => {
  return <h1>{item.name}</h1>;
}));

Registry.addTag('ranker', RankerModel, HtxRanker);
Registry.addTag('bucket', BucketModel, HtxBucket);
Registry.addObjectType(RankerModel);

export { HtxRanker, RankerModel };
