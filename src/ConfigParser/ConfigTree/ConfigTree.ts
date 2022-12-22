import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { TagController, TagControllerName, Tags } from '@tags/Tags';
import { createElement, Fragment } from 'react';
import { ConfigTreeNode } from './ConfigTreeNode';

type RenderProps = {
  annotationAtom: AnnotationAtom,
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
    annotationAtom,
    node,
  }: RenderProps) {
    const configNode = this.structure.get(node ?? this.root);

    console.log({ node, configNode });

    if (!configNode) return null;

    const ControllerClass = configNode?.controller;

    const controller = new ControllerClass(configNode);
    const component = controller.render();

    return component({
      tree: this,
      annotationAtom,
      node: configNode,
    });
  }

  renderChildren({
    node,
    annotationAtom,
  }: {
    node: Element,
    annotationAtom: AnnotationAtom,
  }) {
    const childList = Array.from(node.children);

    return childList.map((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return child.textContent;
      }

      const configNode = this.getNode(child);

      return configNode ? createElement(Fragment, {
        key: configNode.id,
      }, this.render({
        node: child,
        annotationAtom,
      })) : null;
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
        const supportedTags = Object
          .keys(Tags)
          .map(name => name.replace('TagController', ''))
          .join('\n');

        return console.error(`Unknown tag ${node.nodeName}. Available tags:\n${supportedTags}`);
      }

      console.log(node, node.nodeName, controller);

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
      .find(([_, value]) => value.type.toLowerCase() === tag.toLowerCase()) as [TagControllerName, TagController] | undefined;

    return entry ? {
      name: entry[0],
      class: entry[1],
    } : null;
  }
}
