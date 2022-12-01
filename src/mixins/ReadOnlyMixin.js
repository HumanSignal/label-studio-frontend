import { types } from 'mobx-state-tree';

export const ReadOnlyControlMixin = types
  .model('ReadOnlyControlMixin', {})
  .views(self => ({
    isReadOnly() {
      return self.result?.isReadOnly() || self.annotation?.isReadOnly();
    },
  }));

export const ReadOnlyRegionMixin = types
  .model('ReadOnlyRegionMixin', {
    readonly: types.optional(types.boolean, false),
  })
  .views(self => ({
    isReadOnly() {
      return self.locked || self.readonly || self.annotation.isReadOnly() || (parent && (self.parent.isReadOnly() || self.parent.result?.isReadOnly()));
    },
  }));

export const ReadOnlyAreaMixin = types
  .model('ReadOnlyAreaMixin', {
    readonly: types.optional(types.boolean, false),
  })
  .views(self => ({
    isReadOnly() {
      return self.readonly || self.parent.result?.isReadOnly() || self.annotation.isReadOnly();
    },
  }));
