import { guidGenerator } from '../Helpers';

type ConfigNode = {
  id: string,
  name: string,
  type: string,
  parent: Node | null,
}

export class ConfigTree {
  private config: string;
  private root!: Element;
  private nodes: Node[] = [];
  private structure: WeakMap<Node, ConfigNode> = new WeakMap();

  constructor(config: string) {
    this.config = config;
  }

  parse() {
    const parser = new DOMParser();
    const xml = parser.parseFromString(this.config, 'text/xml');

    this.root = xml.documentElement;

    this.walkTree(node => {
      this.nodes.push(node);

      const parent = node.parentNode ?? null;

      this.structure.set(node, {
        id: guidGenerator(),
        name: node.nodeName,
        type: node.nodeName,
        parent: (parent && parent !== xml) ? parent : null,
      });
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
}
