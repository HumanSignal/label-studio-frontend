import { BaseTagController, TagType } from '@tags/Base/Base/BaseTagController';
import { guidGenerator } from '../../core/Helpers';
import { ConfigTree } from './ConfigTree';

export type ConfigTreeNodeParams<Controller extends typeof BaseTagController> = {
  node: Element,
  name: string,
  tree: ConfigTree,
  controller: {
    name: TagType,
    class: Controller,
  },
}

export class ConfigTreeNode<
  Controller extends typeof BaseTagController = typeof BaseTagController,
> {
  id: string;
  name: string;
  type: TagType;
  controllerName: TagType;
  controller: Controller;
  parent: ParentNode | null;
  element: Element;
  tree: ConfigTree;
  children: Set<ChildNode>;

  constructor(params: ConfigTreeNodeParams<Controller>) {
    this.id = guidGenerator();
    this.element = params.node;
    this.tree = params.tree;
    this.name = params.name;
    this.type = this.name.toLowerCase() as TagType;
    this.controllerName = params.controller.name;
    this.controller = params.controller.class;
    this.parent = this.findParent();
    this.children = new Set(params.node.childNodes);
  }

  private findParent() {
    const node = this.element;
    const parent = node.parentNode ?? null;
    const root = node.ownerDocument;

    return (parent && parent !== root) ? parent : null;
  }
}
