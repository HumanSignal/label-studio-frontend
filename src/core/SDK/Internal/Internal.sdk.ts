import { AnnotationsController } from '@atoms/Models/AnnotationsAtom/AnnotationsController';
import { TagController } from '@tags/Base/TagController';
import { CommunicationBus, RegisteredController } from 'src/core/CommunicationBus/CommunicationBus';
import { RootStoreInput } from 'src/Engine/Atoms/Inputs/RootStore';
import { TaskInput } from 'src/Engine/Atoms/Inputs/TaskInput';
import { RootController } from 'src/Engine/Atoms/Models/RootAtom/Controller';
import { taskAtom } from 'src/Engine/Atoms/Models/RootAtom/RootAtom';
import { Store } from 'src/Engine/Atoms/Store';
import { ConfigTree } from 'src/Engine/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/Engine/ConfigTree/ConfigTreeNode';
import { Events } from 'src/utils/events';

type InternalSDKParams = {
  store: Store,
  events: Events,
  communicationBus: CommunicationBus<TagController>,
}

const EVENTS_KEY = Symbol('internal.events');

class InternalSDK extends Store {
  private [EVENTS_KEY]: Events;
  private communicationBus: CommunicationBus<TagController>;
  private controllers = new WeakMap<ConfigTreeNode, TagController>();
  root!: RootController;
  annotations!: AnnotationsController;
  tree!: ConfigTree;

  constructor(params: InternalSDKParams) {
    super();

    this[EVENTS_KEY] = params.events;
    this.communicationBus = params.communicationBus;
  }

  hydrate(data: RootStoreInput) {
    this.parseConfig(data.config ?? '');

    this.root = new RootController();
    this.annotations = new AnnotationsController(this);

    this.initCB();
    this.hydrateRoot(data);
    this.hydrateAnnotations(data.task);
    this.annotations.selectFirstAnnotation();
  }

  /** Communication Bus support*/
  registerWithCB<T extends TagController>(controller: T) {
    this.communicationBus.register(controller);
  }

  unregisterWithCB<T extends TagController>(controller: T) {
    this.communicationBus.unregister(controller);
  }

  subscribe<Controller extends TagController, DataType extends {}>(
    controller: Controller,
    eventName: string,
    callback: (tag: RegisteredController,data: DataType) => void,
  ) {
    return this.communicationBus.on(controller, eventName, callback);
  }

  unsubscribe<Controller extends TagController, DataType extends {}>(
    controller: Controller,
    eventName: string,
    callback: (tag: RegisteredController, data: DataType) => void,
  ) {
    this.communicationBus.off(controller, eventName, callback);
  }

  invoke<Controller extends TagController, DataType extends {}>(
    controller: Controller,
    eventName: string,
    data: DataType,
  ) {
    this.communicationBus.invoke(controller, eventName, data);
  }

  get events() {
    return this[EVENTS_KEY];
  }

  get task() {
    return this.get(taskAtom);
  }

  get data() {
    return JSON.parse(this.task?.data ?? '{}');
  }

  get annotationController() {
    return this.annotations.selectedController;
  }

  findControllerByNode(node: ConfigTreeNode) {
    return this.controllers.get(node);
  }

  createController<Klass extends typeof TagController>(Controller: Klass, node: ConfigTreeNode) {
    if (this.controllers.has(node)) return this.controllers.get(node) as InstanceType<Klass>;

    const instance = new Controller(node, this);

    instance.setAttributes();
    this.registerWithCB(instance);

    this.controllers.set(node, instance);

    return instance;
  }

  destroy() {
    this.tree.walkTree((node) => {
      const configNode = this.tree.getNode(node);

      if (configNode) this.controllers.delete(configNode);
    });

    this.tree.destroy();
    this.annotations.destroy();
    this.communicationBus.destroy();
  }

  private initCB() {
    this.communicationBus = new CommunicationBus();
  }

  private parseConfig(config: string) {
    this.tree = new ConfigTree({
      config: config ?? '',
      sdk: this,
    });

    this.tree.parseFromString();
  }

  private hydrateRoot(data: RootStoreInput) {
    this.root.hydrate(data);
  }

  private hydrateAnnotations(task?: TaskInput) {
    if (!task) return;

    const { annotations, predictions } = task;

    this.annotations.hydrate({
      annotations: annotations ?? [],
      predictions: predictions ?? [],
    });
  }
}

export { InternalSDK };
