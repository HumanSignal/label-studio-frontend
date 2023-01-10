import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { isDefined } from 'src/utils/utilities';
import { BaseTagView } from './BaseTagView';

export enum TagType {
  baseVisual = 'base-visual',
  base = 'base',
  view = 'view',
  header = 'header',
  labels = 'labels',
  label = 'label',
  text = 'text',
  hypertext = 'hypertext',
  hypertextlabels = 'hypertextlabels',
}

export class BaseTagController {
  static type = TagType.base;

  static allowChildren = true;

  private node: ConfigTreeNode<any>;

  private static view: BaseTagView<typeof BaseTagController, any>;

  sdk: InternalSDK;

  static defineView<
    Controller extends typeof BaseTagController,
    View extends BaseTagView<Controller, Props>,
    Props = {},
  >(view: View) {
    this.view = view;

    return view;
  }

  constructor(
    node: ConfigTreeNode<any>,
    sdk: InternalSDK,
  ) {
    this.node = node;
    this.sdk = sdk;
  }

  get type() {
    return (this.constructor as typeof BaseTagController).type as TagType;
  }

  render() {
    return (this.constructor as typeof BaseTagController).view;
  }

  setAttributes() {
    const { attributes } = this.node.element;

    for(const attribute of attributes) {
      const name = attribute.name.toLowerCase();
      const { value } = attribute;
      const attributeProvider = (this as any)[name];

      if (isDefined(attributeProvider)) {
        attributeProvider.value = value;
        attributeProvider.name = name;
        attributeProvider.node = this.node;
        attributeProvider.controller = this;
      }
    }
  }
}

export const defineTagView = <
  ControllerClass extends typeof BaseTagController,
  View extends BaseTagView<ControllerClass, Props>,
  Props = {},
>(controller: ControllerClass, view: View): View => {
  return controller.defineView<ControllerClass, View, Props>(view);
};
