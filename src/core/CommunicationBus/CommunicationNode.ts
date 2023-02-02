import { TagController } from '@tags/Base/TagController';
import { ConfigTreeNode } from 'src/Engine/ConfigTree/ConfigTreeNode';
import { Events } from 'src/utils/events';
import { CommunicationBus } from './CommunicationBus';

type CommunicationNodeOptions<Controller extends TagController> = {
  controller: Controller,
  configNode: ConfigTreeNode,
  bus: CommunicationBus<Controller>,
  action?: string,
  expression?: string,
}

class CommunicationNode<Controller extends TagController> {
  events: Events;
  action?: string;
  expression?: string;
  private controller: Controller;
  private bus: CommunicationBus<Controller>;
  private configNode: ConfigTreeNode;
  private _connections!: Set<Controller>;
  private connectedControllers = 0;

  constructor(options: CommunicationNodeOptions<Controller>) {
    this.events = new Events();
    this.bus = options.bus;
    this.controller = options.controller;
    this.action = options.action;
    this.expression = options.expression;
    this.configNode = options.configNode;
  }

  get type() {
    return this.configNode.type;
  }

  get name() {
    return this.configNode.element.getAttribute('name')!;
  }

  get toName() {
    return this.configNode.element.getAttribute('toname')!;
  }

  /**
   * Get controllers connected to the current one
   *
   * Connections are determined by the following rules:
   * 1. If the current node has a toName attribute, find a node with a matching `name`
   * 2. If the current node has a name attribute, find a node with a matching `toName`
   * 3. If the current node has children, connect the node to them
   * 4. If the current node has a parent, connect the node to it
   */
  get connections() {
    // if (this.useCachedConnections) this._connections;
    const tree = this.configNode.tree;
    const currentConfigNode = this.configNode;
    const connections = this._connections ?? new Set<Controller>();
    const [currentNodeName, currentNodeToName] = [this.name, this.toName];

    connections.clear();

    tree.walkTree((node, configNode) => {
      if (!configNode) return;
      if (configNode === currentConfigNode) return;

      const controller = tree.findActiveController(configNode);

      if (!controller) return;

      const [name, toName] = [
        node.getAttribute('name'),
        node.getAttribute('toname'),
      ];

      const isChildNode = currentConfigNode.children.has(node);
      const isParentNode = currentConfigNode.parent === node;
      const matchingNode = currentNodeToName === name || currentNodeName === toName;

      // Find event emitting nodes
      if (matchingNode || isParentNode || isChildNode) connections.add(controller as Controller);
    });

    this.connectedControllers = this.bus.registrySize;

    return this._connections = connections;
  }

  destroy() {
    this.events.clear();
  }

  toString() {
    return `CommunicationNode<${this.controller}>`;
  }

  private get useCachedConnections() {
    return this._connections && this.connectedControllers === this.bus.registrySize;
  }
}

export { CommunicationNode };
