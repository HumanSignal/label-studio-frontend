import { TagController } from '@tags/Base/TagController';
import { CommunicationBus, RegisteredController } from 'src/core/CommunicationBus/CommunicationBus';
import { RootStoreInput } from 'src/Engine/Atoms/Inputs/RootStore';
import { TaskInput } from 'src/Engine/Atoms/Inputs/TaskInput';
import { AnnotationController } from '@atoms/Models/AnnotationsAtom/AnnotationsController';
import { RootController } from 'src/Engine/Atoms/Models/RootAtom/Controller';
import { taskAtom } from 'src/Engine/Atoms/Models/RootAtom/RootAtom';
import { Store } from 'src/Engine/Atoms/Store';
import { StoreAccess } from 'src/Engine/Atoms/StoreAccess';
import { ConfigTree } from 'src/Engine/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/Engine/ConfigTree/ConfigTreeNode';
import { Registry } from 'src/Engine/Tags/Registry';
import { Events } from 'src/utils/events';

type InternalSDKParams = {
  store: Store,
  events: Events,
  communicationBus: CommunicationBus<TagController>,
}

class InternalSDK extends StoreAccess {
  private events: Events;
  private communicationBus: CommunicationBus<TagController>;
  private controllers = new WeakMap<ConfigTreeNode, TagController>();
  root: RootController;
  annotations: AnnotationController;
  tagRegistry: Registry;
  tree!: ConfigTree;

  constructor(params: InternalSDKParams) {
    super(params.store);
    this.events = params.events;
    this.communicationBus = params.communicationBus;

    this.root = new RootController(params.store);
    this.tagRegistry = Registry.getInstance();
    this.annotations = new AnnotationController(params.store);

    console.log(this.communicationBus);
  }

  hydrate(data: RootStoreInput) {
    this.parseConfig(data.config ?? '');
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

  get task() {
    return this.store.get(taskAtom);
  }

  get data() {
    return JSON.parse(this.task?.data ?? '{}');
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
