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
 * The `Ranker` tag is used to rank items in a `List` tag or pick relevant items from a `List`, depending on using nested `Bucket` tags.
 * In simple case of `List` + `Ranker` tags the first one becomes interactive and saved result is an array of ids in new order.
 * With `Bucket`s any items from the `List` can be moved to these buckets, and resulting groups will be exported as a dict `{ bucket-name-1: [array of ids in this bucket], ... }`
 * By default all items will sit in `List` and will not be exported, unless they are moved to a bucket. But with `default="true"` parameter you can specify a bucket where all items will be placed by default, so exported result will always have all items from the list, grouped by buckets.
 * Columns and items can be styled in `Style` tag by using respective `.htx-ranker-column` and `.htx-ranker-item` classes. Titles of columns are defined in `title` parameter of `Bucket` tag.
 * @example
 * <!-- Visual appearance can be changed via Style tag with these predefined classnames -->
 * <View>
 *   <Style>
 *     .htx-ranker-column { background: cornflowerblue; }
 *     .htx-ranker-item { background: lightgoldenrodyellow; }
 *   </Style>
 *   <List name="results" value="$items" title="Search Results" />
 *   <Ranker name="rank" toName="results" />
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
 *   "from_name": "rank",
 *   "to_name": "results",
 *   "type": "ranker",
 *   "value": { "ranker": ["mdn", "wiki", "blog"] }
 * }
 * @example
 * <!-- Example of using Buckets with Ranker tag -->
 * <View>
 *   <List name="results" value="$items" title="Search Results" />
 *   <Ranker name="rank" toName="results">
 *     <Bucket name="best" title="Best results" />
 *     <Bucket name="ads" title="Paid results" />
 *   </Ranker>
 * </View>
 * @example
 * <!-- Example result for Ranker tag with Buckets; data is the same -->
 * {
 *   "from_name": "rank",
 *   "to_name": "results",
 *   "type": "ranker",
 *   "value": { "ranker": {
 *     "best": ["mdn"],
 *     "ads": ["blog"]
 *   } }
 * }
 * @name Ranker
 * @meta_title Ranker Tag allows you to rank items in a List or, if Buckets are used, pick relevant items from a List
 * @meta_description Customize Label Studio by sorting results for machine learning and data science projects.
 * @param {string} name    Name of the element
 * @param {string} toName  List tag name to connect to
 */
const Model = types
  .model({
    type: 'ranker',
    toname: types.maybeNull(types.string),

    // @todo allow Views inside: ['bucket', 'view']
    children: Types.unionArray(['bucket']),
  })
  .views(self => ({
    get list() {
      const list = self.annotation.names.get(self.toname);

      return list.type === 'list' ? list : null;
    },
    get buckets() {
      return Tree.filterChildrenOfType(self, 'BucketModel');
    },
    /** @returns {string | undefined} */
    get defaultBucket() {
      return self.buckets.find(b => b.default)?.name;
    },
    get rankOnly() {
      return !self.buckets.length;
    },
    /** @returns {Array<{ id: string, title: string }>} */
    get columns() {
      if (!self.list) return [];
      if (self.rankOnly) return [{ id: self.name, title: self.list.title }];

      const columns = self.buckets.map(b => ({ id: b.name, title: b.title ?? '' }));

      if (!self.defaultBucket) columns.unshift({ id: '_', title: self.list.title });

      return columns;
    },
  }))
  .views(self => ({
    get dataSource() {
      const data = self.list?._value;
      const items = self.list?.items;
      const ids = Object.keys(items);
      const columns = self.columns;
      /** @type {Record<string, string[]>} */
      const result = self.result?.value.ranker;
      let itemIds = {};

      if (!data) return [];
      // one array of items sitting in List tag, just reorder them if result is given
      if (self.rankOnly) {
        // 
        itemIds = { [self.name]: result ?? ids };
      } else if (!result) {
        itemIds = { [self.defaultBucket ?? '_']: ids };
      } else {
        itemIds = { ...result };

        // original list is shown, but there are no such column in result,
        // so create it from results not groupped into buckets
        if (!self.defaultBucket && !result['_']) {
          const selected = Object.values(result).flat();
          const left = ids.filter(id => !selected.includes(id));

          itemIds['_'] = left;
        }
        // @todo what if there are items in data that are not presented in result?
        // @todo they must likely should go into _ bucket as well
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
      if (!self.list) return;

      // @todo later we will most probably remove _ bucket from exported result
      if (self.result) return;

      const ids = Object.keys(self.list?.items);

      if (self.rankOnly) {
        self.createResult(ids);
      } else if (self.defaultBucket) {
        self.createResult({ [self.defaultBucket]: ids });
      }
    },
  }));

const RankerModel = types.compose('RankerModel', Base, AnnotationMixin, Model);

const HtxRanker = inject('store')(
  observer(({ item }) => {
    const data = item.dataSource;


    if (!data) return null;

    return (
      <Ranker inputData={data} handleChange={item.updateResult} />
    );
  }),
);

/**
 * Simple container for items in `Ranker` tag. Can be used to group items in `List` tag.
 * @name Bucket
 * @subtag
 * @param {string} name        Name of the column; used as a key in resulting data
 * @param {string} title       Title of the column
 * @param {boolean} [default]  This Bucket will be used to display results from `List` by default; see `Ranker` tag for more details
 */
const BucketModel = types.model('BucketModel', {
  id: types.optional(types.identifier, guidGenerator),
  type: 'bucket',
  name: types.string,
  title: types.maybeNull(types.string),
  default: types.optional(types.boolean, false),
});

const HtxBucket = inject('store')(observer(({ item }) => {
  return <h1>{item.name}</h1>;
}));

Registry.addTag('ranker', RankerModel, HtxRanker);
Registry.addTag('bucket', BucketModel, HtxBucket);
Registry.addObjectType(RankerModel);

export { HtxRanker, RankerModel };
