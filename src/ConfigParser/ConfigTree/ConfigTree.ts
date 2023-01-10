import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { BaseTagController, TagType } from '@tags/Base/Base/BaseTagController';
import { Tags } from '@tags/Tags';
import { TagTypes } from '@tags/TagTypes';
import { createElement, Fragment } from 'react';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { ConfigTreeNode } from './ConfigTreeNode';

type RenderProps = {
  annotationAtom: AnnotationAtom,
  node?: Node,
}

type ConfigParams = {
  config: string,
  sdk: InternalSDK,
}

export class ConfigTree {
  private config: string;
  private root!: Element;
  private nodes: Node[] = [];
  private structure: WeakMap<Node, ConfigTreeNode<any>> = new WeakMap();
  private controllers: WeakMap<ConfigTreeNode<any>, any> = new WeakMap();
  sdk: InternalSDK;

  constructor({
    config,
    sdk,
  }: ConfigParams) {
    this.config = config;
    this.sdk = sdk;
  }

  getNode(node: Node) {
    return this.structure.get(node);
  }

  render({
    annotationAtom,
    node,
  }: RenderProps) {
    const configNode = this.structure.get(node ?? this.root);

    if (!configNode) return null;

    const controller = this.initController(configNode);

    return controller.render()({
      tree: this,
      annotationAtom,
      node: configNode,
      controller,
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

      const controller = this.findController(node.nodeName as TagType);

      if (!controller) {
        const supportedTags = Object
          .keys(Tags)
          .map(name => name.replace('TagController', ''))
          .join('\n');

        return console.error(`Unknown tag ${node.nodeName}. Available tags:\n${supportedTags}`);
      }

      const treeNode = new ConfigTreeNode({
        node,
        name: node.nodeName,
        tree: this,
        controller,
      });

      this.structure.set(node, treeNode);
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

  private initController<T extends typeof BaseTagController>(node: ConfigTreeNode<T>) {
    if (this.controllers.has(node)) return this.controllers.get(node);

    const ControllerClass = node.controller;
    const controller = new ControllerClass(node, this.sdk);

    controller.setAttributes();

    this.controllers.set(node, controller);
    return controller;
  }

  private findController(tagNameRaw: TagType): {
    name: TagType,
    class: typeof TagTypes[TagType],
  } | null {
    const tagName = tagNameRaw.toLowerCase() as TagType;
    const controller = TagTypes[tagName];

    return controller ? {
      name: tagName,
      class: controller,
    } : null;
  }
}
