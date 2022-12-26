import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { TagController } from '@tags/Tags';
import { guidGenerator } from '../../core/Helpers';
import { ConfigAttributes } from './ConfigAttributes';
import { ConfigTree } from './ConfigTree';

export type ConfigTreeNodeParams<Controller extends TagController> = {
  node: Element,
  name: string,
  tree: ConfigTree,
  controller: {
    name: TagType,
    class: Controller,
  },
}

export class ConfigTreeNode<Controller extends TagController = any> {
  id: string;
  name: string;
  type: TagType;
  controllerName: TagType;
  controller: Controller;
  parent: ParentNode | null;
  node: Element;
  tree: ConfigTree;
  children: Set<ChildNode>;
  attributes: ConfigAttributes;

  constructor(params: ConfigTreeNodeParams<Controller>) {
    this.id = guidGenerator();
    this.node = params.node;
    this.tree = params.tree;
    this.name = params.name;
    this.type = this.name.toLowerCase() as TagType;
    this.controllerName = params.controller.name;
    this.controller = params.controller.class;
    this.parent = this.findParent();
    this.children = new Set(params.node.childNodes);
    this.attributes = new ConfigAttributes(this);
  }

  private findParent() {
    const node = this.node;
    const parent = node.parentNode ?? null;
    const root = node.ownerDocument;

    return (parent && parent !== root) ? parent : null;
  }
}
