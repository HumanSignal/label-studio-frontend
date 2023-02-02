import { RegisteredController } from 'src/core/CommunicationBus/CommunicationBus';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { AttributeValue } from 'src/Engine/ConfigTree/Attributes/AttributeValue';
import { ConfigTreeNode } from 'src/Engine/ConfigTree/ConfigTreeNode';
import { TagView } from './TagView';

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

export class TagController {
  static type = TagType.base;

  static allowChildren = true;

  private configNode: ConfigTreeNode;

  private static view: TagView<typeof TagController, any>;

  private attributes: Map<string, AttributeValue<any>> = new Map();

  #sdk: InternalSDK;

  get sdk() {
    return this.#sdk;
  }

  get parent(): TagController | null {
    const parentNode = this.configNode.parentConfigNode;

    if (!parentNode) return null;

    const controller = this.sdk.tree.findActiveController(parentNode);

    return controller ? controller : null;
  }

  static defineView<
    Controller extends typeof TagController,
    View extends TagView<Controller, Props>,
    Props = {},
  >(view: View) {
    this.view = view;

    return view;
  }

  constructor(
    configNode: ConfigTreeNode,
    sdk: InternalSDK,
  ) {
    this.configNode = configNode;
    this.#sdk = sdk;
    this.#sdk.registerWithCB(this);
  }

  get type() {
    return (this.constructor as typeof TagController).type as TagType;
  }

  afterRender() {
    /** Executed when render's finidhed */
  }

  getConfigNode() {
    return this.configNode;
  }

  render() {
    return (this.constructor as typeof TagController).view;
  }

  getAttribute(name: string) {
    const attr = this[name as keyof this];

    if (attr && typeof attr === 'object' && 'value' in attr) {
      return attr.value;
    }

    return null;
  }

  setAttributes() {
    const { element } = this.configNode;

    for (const attrName in this) {
      const attributeReader = this[attrName];

      if (!(attributeReader instanceof AttributeValue)) continue;

      const attributeValue = element.getAttribute(attrName.toLowerCase());

      attributeReader.configure({
        name: attrName,
        value: attributeValue ?? attributeReader.defaultValue,
        configNode: this.configNode,
        controller: this,
      });

      delete this[attrName];

      Object.defineProperty(this, attrName, {
        get: () => attributeReader,
      });

      this.attributes.set(attrName, attributeReader);
    }
  }

  subscribe<
    DataType extends {},
  >(eventName: string, callback: (
    tag: RegisteredController,
    data: DataType
  ) => void) {
    this.sdk.subscribe(this, eventName, callback);
  }

  unsubscribe<
    DataType extends {},
  >(eventName: string, callback: (
    tag: RegisteredController,
    data: DataType
  ) => void) {
    this.sdk.unsubscribe(this, eventName, callback);
  }

  emit<DataType extends {}>(eventName: string, data: DataType) {
    this.sdk.invoke(this, eventName, data);
  }

  toString() {
    return `Tag<${(this.constructor as typeof TagController).name}#${this.configNode.element.getAttribute('name')}>`;
  }

  destroy() {
    this.attributes.forEach((attribute) => {
      attribute.destroy();
    });

    this.attributes.clear();
  }
}

export const defineTagView = <
  ControllerClass extends typeof TagController,
  View extends TagView<ControllerClass, Props>,
  Props = {},
>(controller: ControllerClass, view: View): View => {
  return controller.defineView<ControllerClass, View, Props>(view);
};
