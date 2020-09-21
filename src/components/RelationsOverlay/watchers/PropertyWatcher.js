import { observe } from "mobx";
import { debounce } from "../../../utils/debounce";

export const createPropertyWatcher = props => {
  return class {
    constructor(root, element, getElement, callback) {
      this.root = root;
      this.element = element;
      this.callback = callback;

      this.handleUpdate();
    }

    handleUpdate() {
      this.disposers = props.map(property => {
        return observe(this.element, property, this.onUpdate, true);
      });
    }

    onUpdate = debounce(() => {
      this.callback();
    }, 10);

    destroy() {
      this.disposers.forEach(dispose => dispose());
    }
  };
};
