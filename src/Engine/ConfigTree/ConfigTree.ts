import { TagType } from '@tags/Base/TagController';
import { createElement, Fragment, ReactElement } from 'react';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
import { Tags } from 'src/Engine/Tags/Tags';
import { TagTypes } from 'src/Engine/Tags/TagTypes';
import { guidGenerator } from 'src/utils/unique';
import { isDefined } from 'src/utils/utilities';
import { ConfigTreeNode } from './ConfigTreeNode';

const SUPPORTED_TAGS = Object
  .keys(Tags)
  .map(name => name.replace('Controller', ''));

type RenderProps = {
  annotationAtom: AnnotationAtom,
  node?: Element,
}

type ConfigParams = {
  config: string,
  sdk: InternalSDK,
}

export class ConfigTree {
  private config: string;
  private root!: Element;
  private nodes: Node[] = [];
  private structure: WeakMap<Node, ConfigTreeNode> = new WeakMap();
  private renderable: WeakMap<Node, ReactElement | null> = new WeakMap();
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
    node,
    annotationAtom,
  }: RenderProps) {
    const element = node ?? this.root;

    if (this.renderable.has(element)) return this.renderable.get(element) ?? null;

    const configNode = this.getNodeForElement(element);
    const controller = this.initController(configNode);
    const RenderableTag = controller.render();

    const result = createElement(RenderableTag, {
      tree: this,
      annotationAtom,
      node: configNode,
      controller,
    });

    this.renderable.set(element, result);

    if (element === this.root) this.registerNodes();

    controller.afterRender();

    return result;
  }

  renderChildren({
    node,
    annotationAtom,
  }: RenderProps) {
    if (!node) return null;

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

  parseFromString() {
    const parser = new DOMParser();
    const xml = parser.parseFromString(this.config, 'text/xml');

    this.root = xml.documentElement;

    this.walkTree(node => {
      this.nodes.push(node);

      if (!this.validateControllerForNode(node)) return;

      this.unifyAttributes(node);

      const treeNode = new ConfigTreeNode({
        node,
        name: node.nodeName,
        tree: this,
      });

      this.structure.set(node, treeNode);
    });
  }

  walkTree(callback: (node: Element, configNode?: ConfigTreeNode) => void) {
    const treeWalker = document.createTreeWalker(this.root, NodeFilter.SHOW_ELEMENT);

    callback(this.root, this.structure.get(this.root));

    while (treeWalker.nextNode()) {
      callback(
        treeWalker.currentNode as Element,
        this.structure.get(treeWalker.currentNode),
      );
    }
  }

  validate() {
    if (this.root.nodeName !== 'config') {
      throw new Error('Invalid config file');
    }
  }

  findActiveController(node: ConfigTreeNode) {
    return this.sdk.findControllerByNode(node);
  }

  getNodeForElement(element: Element) {
    const configNode = this.structure.get(element);

    if (!configNode) throw new Error(`Can't find node for element ${element}`);

    return configNode;
  }

  findNodeByName(name: string) {
    const node = this.nodes.find(node => node.nodeName === name);

    if (!node) return null;

    const configNode = this.getNode(node);

    return configNode;
  }

  private validateControllerForNode(node: Element) {
    const nodeName = node.nodeName;

    if (!this.controllerClassExists(nodeName)) {
      return console.error(`Unknown tag ${nodeName}. Available tags:\n${SUPPORTED_TAGS.join('\n')}`);
    }

    return true;
  }

  private unifyAttributes(element: Element) {
    const attrs = Array.from(element.attributes);

    // Lowercase all attributes
    attrs.forEach((attribute) => {
      element.removeAttribute(attribute.name);
      element.setAttribute(attribute.name.toLowerCase(), attribute.value);
    });

    // Add name and toName attributes if missing
    if (element.getAttribute('name') === null) {
      element.setAttribute('name', guidGenerator());
    }

    if (element.getAttribute('toname') === null) {
      element.setAttribute('toname', guidGenerator());
    }
  }

  private registerNodes() {
    this.nodes.forEach((node) => {
      const configNode = this.getNode(node);

      if (!configNode) return;

      const controller = this.findActiveController(configNode);

      if (!controller) return;

      console.log(`Register ${controller}`);
      this.sdk.registerWithCB(controller);
    });
  }

  private initController(node: ConfigTreeNode) {
    const ControllerClass = this.getControllerClass(node.element.nodeName);

    if (!ControllerClass) {
      throw new Error(`Can't find controller for ${node.type}`);
    }

    return this.sdk.createController(ControllerClass.class, node);
  }

  private controllerClassExists(tagName: string) {
    return isDefined(TagTypes[tagName.toLowerCase() as TagType]);
  }

  private getControllerClass(tagNameRaw: string): {
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
