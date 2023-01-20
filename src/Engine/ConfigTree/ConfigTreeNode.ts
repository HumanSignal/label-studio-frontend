import { TagType } from '@tags/Base/TagController';
import { guidGenerator } from '../../core/Helpers';
import { ConfigTree } from './ConfigTree';

export type ConfigTreeNodeParams = {
  node: Element,
  name: string,
  tree: ConfigTree,
}

export class ConfigTreeNode {
  id: string;
  name: string;
  type: TagType;
  parent: ParentNode | null;
  element: Element;
  tree: ConfigTree;
  children: Set<ChildNode>;

  constructor(params: ConfigTreeNodeParams) {
    this.id = guidGenerator();
    this.element = params.node;
    this.tree = params.tree;
    this.name = params.name;
    this.type = this.name.toLowerCase() as TagType;
    this.parent = this.findParent();
    this.children = new Set(params.node.childNodes);
  }

  getAttribute(name: string) {
    return this.element.getAttribute(name);
  }

  private findParent() {
    const node = this.element;
    const parent = node.parentNode ?? null;
    const root = node.ownerDocument;

    return (parent && parent !== root) ? parent : null;
  }
}
