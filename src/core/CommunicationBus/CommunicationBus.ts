import { TagController, TagType } from '@tags/Base/TagController';
import { Events } from 'src/utils/events';
import { CommunicationNode } from './CommunicationNode';

export type RegisteredController<Controller extends TagController = TagController> = {
  type: TagType,
  name: string,
  events: Events,
  controller: Controller,
  connections: Set<Controller>,
  action?: string,
  expression?: string,
}

export type PostponedListener = {
  eventName: string,
  callback: (tag: RegisteredController<any>, data: any) => void,
}

const REGISTRY_SIZE = Symbol('registry-size');

type AnyController = unknown extends TagController ? TagController : TagController;

class CommunicationBus<
  Controller extends AnyController
> {
  private registry = new WeakMap<Controller, CommunicationNode<Controller>>();
  private postponedSubscriptions = new WeakMap<Controller, Set<PostponedListener>>();
  private [REGISTRY_SIZE] = 0;

  /**
   * Register a controller within CB for further communication
   * Controller is any instance of BaseTagController or its descendants
   */
  register(controller: Controller) {
    const configNode = controller.getConfigNode();

    if (this.registry.has(controller)) return;

    const communicationNode = new CommunicationNode({
      controller,
      configNode,
      bus: this,
    });

    this.registry.set(controller, communicationNode);

    this.releasePostponedListeners(controller);
    this[REGISTRY_SIZE] += 1;
  }

  /**
   * Unregister a controller from CB removing all the events and listeners
   */
  unregister(controller: Controller) {
    const registeredController = this.registry.get(controller);

    if (!registeredController) return;

    registeredController.events.clear();

    this.registry.delete(controller);
    this[REGISTRY_SIZE] -= 1;
  }

  /**
   * Subscribe to an event
   */
  on<DataType extends {}>(
    controller: Controller,
    eventName: string,
    callback: (tag: RegisteredController, data: DataType) => void,
  ) {
    const registeredController = this.registry.get(controller);

    if (!registeredController) {
      this.subscribeLater(controller, eventName, callback);
      return;
    }

    console.log('subscribed', eventName, controller);

    registeredController.connections.forEach(ctrl => {
      const registree = this.registry.get(ctrl);

      registree?.events.on(eventName, callback);
    });
  }

  /**
   * Unsubscribe from an event
   */
  off(
    controller: Controller,
    eventName: string,
    callback: (tag: RegisteredController, data: any) => void,
  ) {
    const registeredController = this.registry.get(controller);

    if (!registeredController) {
      throw new Error('Controller is not registered with CommunicationBus');
    }

    registeredController.connections.forEach(ctrl => {
      const registree = this.registry.get(ctrl);

      registree?.events.off(eventName, callback);
    });
  }

  invoke<DataType extends {}>(
    controller: Controller,
    eventName: string,
    data: DataType,
  ) {
    const registeredController = this.registry.get(controller);

    if (!registeredController) {
      throw new Error(`Controller ${controller} is not registered with CommunicationBus`);
    }

    registeredController.events.invoke(eventName, registeredController, data);
  }

  get registrySize() {
    return this[REGISTRY_SIZE];
  }

  private subscribeLater<DataType extends {}>(
    controller: Controller,
    eventName: string,
    callback: (tag: RegisteredController, data: DataType) => void,
  ) {

    const events = this.getPostponedListenersList(controller);

    events.add({
      eventName,
      callback,
    });
  }

  private getPostponedListenersList(controller: Controller) {
    let events = this.postponedSubscriptions.get(controller);

    if (!events) {
      events = new Set<PostponedListener>();
      this.postponedSubscriptions.set(controller, events);
    }

    return events;
  }

  private releasePostponedListeners(controller: Controller) {
    const registeredController = this.registry.get(controller)!;
    const events = this.getPostponedListenersList(controller);

    events.forEach(({ eventName, callback }) => {
      registeredController.connections.forEach(ctrl => {
        const registree = this.registry.get(ctrl);

        registree?.events.on(eventName, callback);
      });
    });

    events.clear();
    this.postponedSubscriptions.delete(controller);
  }
}

export { CommunicationBus };
