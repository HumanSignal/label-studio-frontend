import { BaseTagController } from '@tags/Base/BaseTag/BaseTagController';
import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';

const ATTRIBUTES = new WeakMap<ConfigTreeNode, Record<string, string>>();

type AnyController<Controller extends typeof BaseTagController> = unknown extends Controller ? never : Controller;

type AttributeConfig = {
  name: string,
  required?: boolean,
  default?: any,
}

const VALID_ATTRIBUTES = new WeakMap<typeof BaseTagController, AttributeConfig[]>();

export type AttributeParserName<T extends string> = `${T}Parser`;

export type AttributeParserParams = {
  value: string,
  name: string,
  node: ConfigTreeNode,
};

export type AttributeParser = (atribute: AttributeParserParams) => any;

export type AttributeParsers = Record<AttributeParserName<string>, AttributeParser>;

export class ConfigAttributes {
  parsers: AttributeParsers = {};

  private treeNode: ConfigTreeNode;

  private availableAttributes?: AttributeConfig[];

  get attrs() {
    return ATTRIBUTES.get(this.treeNode);
  }

  private get controller() {
    return this.treeNode.controller.constructor as typeof BaseTagController;
  }

  constructor(treeNode: ConfigTreeNode) {
    ATTRIBUTES.set(treeNode, {});
    this.treeNode = treeNode;

    this.availableAttributes = VALID_ATTRIBUTES.get(this.controller);

    this.grabAttributes();
  }

  private grabAttributes() {
    const attributes = this.treeNode.node.attributes;
    const internalAttributes = ATTRIBUTES.get(this.treeNode);

    for (const attribute of attributes) {
      const name = attribute.name.toLowerCase();
      const { value } = attribute;

      const parser = this.parsers[`${name}Parser`];

      this.validateAttribute(name, value);

      Object.defineProperty(internalAttributes, name.toLowerCase(), {
        get() {
          return parser ? parser({
            value,
            name,
            node: this.treeNode,
          }) : value;
        },
      });
    }
  }

  private validateAttribute(name: string, value: string) {
    const attribute = this.availableAttributes?.find((attr) => attr.name === name);

    if (attribute?.required && !value) {
      throw new Error(`Attribute ${name} is required for tag ${this.controller.type}`);
    }
  }
}

export function withAttributes(attributes: AttributeConfig[]) {
  return function<Controller extends typeof BaseTagController>(target: AnyController<Controller>) {
    VALID_ATTRIBUTES.set(target, attributes);
  };
}
