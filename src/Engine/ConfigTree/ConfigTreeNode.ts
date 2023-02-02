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
  parent: Element | null;
  element: Element;
  tree: ConfigTree;
  children: Set<Element>;

  constructor(params: ConfigTreeNodeParams) {
    this.id = guidGenerator();
    this.element = params.node;
    this.tree = params.tree;
    this.name = params.name;
    this.type = this.name.toLowerCase() as TagType;
    this.parent = this.findParent();
    this.children = new Set(Array.from(params.node.children) as Element[]);
  }

  destroy() {
    this.children.clear();
  }

  getAttribute(name: string) {
    return this.element.getAttribute(name);
  }

  get parentConfigNode(): ConfigTreeNode | null {
    if (!this.parent) return null;

    const node = this.tree.getNode(this.parent);

    return node ? node : null;
  }

  private findParent() {
    const node = this.element;
    const parent = node.parentNode ?? null;
    const root = node.ownerDocument;

    return (parent && parent !== root) ? parent as Element : null;
  }
}
