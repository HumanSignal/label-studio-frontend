import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { TagController, TagControllerName } from '@tags/Tags';
import { guidGenerator } from '../Helpers';
import { ConfigTree } from './ConfigTree';

export type ConfigTreeNodeParams = {
  node: Node,
  name: string,
  tree: ConfigTree,
  controller: {
    name: TagControllerName,
    class: TagController,
  },
}

export class ConfigTreeNode {
  id: string;
  name: string;
  type: InternalTagType;
  controllerName: TagControllerName;
  controller: TagController;
  parent: Node | null;
  node: Node;
  tree: ConfigTree;
  children: Set<Node>;

  constructor(params: ConfigTreeNodeParams) {
    this.id = guidGenerator();
    this.node = params.node;
    this.tree = params.tree;
    this.name = params.name;
    this.type = this.name.toLowerCase() as InternalTagType;
    this.controllerName = params.controller.name;
    this.controller = params.controller.class;
    this.parent = this.findParent();
    this.children = new Set(params.node.childNodes);
  }

  private findParent() {
    const node = this.node;
    const parent = node.parentNode ?? null;
    const root = node.ownerDocument;

    return (parent && parent !== root) ? parent : null;
  }
}
