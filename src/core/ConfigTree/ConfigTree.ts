import { Annotation } from '@atoms/Models/AnnotationsAtom/Types';
import { TagController, TagControllerName, Tags } from '@tags/Tags';
import { Atom } from 'jotai';
import { ConfigTreeNode } from './ConfigTreeNode';

type RenderProps = {
  annotationEntity: Atom<Annotation>,
  node?: Node,
}
export class ConfigTree {
  private config: string;
  private root!: Element;
  private nodes: Node[] = [];
  private structure: WeakMap<Node, ConfigTreeNode> = new WeakMap();

  constructor(config: string) {
    this.config = config;
  }

  getNode(node: Node) {
    return this.structure.get(node);
  }

  render({
    annotationEntity,
    node,
  }: RenderProps) {
    const configNode = this.structure.get(node ?? this.root);

    if (!configNode) return null;

    const ControllerClass = configNode?.controller;

    const controller = new ControllerClass(configNode);

    return controller.render()({
      tree: this,
      annotationEntity,
      node: configNode,
    });
  }

  parse() {
    const parser = new DOMParser();
    const xml = parser.parseFromString(this.config, 'text/xml');

    this.root = xml.documentElement;

    this.walkTree(node => {
      this.nodes.push(node);

      const controller = this.findController(node.nodeName);

      if (!controller) {
        console.warn(`Unknown tag ${node.nodeName}. Available tags: ${Object.values(Tags).map(t => t.type).join(', ')}`);
        return;
      }

      this.structure.set(node, new ConfigTreeNode({
        node,
        name: node.nodeName,
        tree: this,
        controller,
      }));
    });
  }

  walkTree(callback: (node: Element) => void) {
    const treeWalker = document.createTreeWalker(this.root, NodeFilter.SHOW_ELEMENT);

    callback(this.root);

    while (treeWalker.nextNode()) {
      callback(treeWalker.currentNode as Element);
    }
  }

  validate() {
    if (this.root.nodeName !== 'config') {
      throw new Error('Invalid config file');
    }
  }

  private findController(tag: string) {
    const entry = Object
      .entries(Tags)
      .find(([_, value]) => value.type === tag.toLowerCase()) as [TagControllerName, TagController] | undefined;

    return entry ? {
      name: entry[0],
      class: entry[1],
    } : null;
  }
}
