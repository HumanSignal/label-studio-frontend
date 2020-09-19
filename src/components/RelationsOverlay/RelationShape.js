/* eslint-disable no-unused-expressions */
export class RelationShape {
  params = {};

  _onUpdated = null;

  constructor(params) {
    Object.assign(this.params, params);

    this._watcher = new this.params.watcher(
      this.params.root,
      this.params.element,
      this.params.getElement ?? (el => el),
      this.onChanged,
    );
  }

  boundingBox() {
    return this.params.boundingBox(this.params.element);
  }

  onUpdate(callback) {
    this.onUpdated = callback;
  }

  onChanged = () => {
    this.onUpdated?.();
  };

  destroy() {
    this.onUpdated = null;
  }
}
