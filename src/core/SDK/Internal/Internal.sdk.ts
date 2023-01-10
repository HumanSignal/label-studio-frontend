import { RootStoreInput } from '@atoms/Inputs/RootStore';
import { TaskInput } from '@atoms/Inputs/TaskInput';
import { AnnotationController } from '@atoms/Models/AnnotationsAtom/Controller';
import { RootController } from '@atoms/Models/RootAtom/Controller';
import { taskAtom } from '@atoms/Models/RootAtom/RootAtom';
import { Store } from '@atoms/Store';
import { StoreAccess } from '@atoms/StoreAccess';
import { Registry } from '@tags/Registry';
import { ConfigTree } from 'src/ConfigParser/ConfigTree/ConfigTree';
import { EventInvoker } from 'src/utils/events';

type InternalSDKParams = {
  store: Store,
  events: EventInvoker,
}

class InternalSDK extends StoreAccess {
  private events: EventInvoker;
  root: RootController;
  annotations: AnnotationController;
  tagRegistry: Registry;
  tree!: ConfigTree;

  constructor(params: InternalSDKParams) {
    super(params.store);
    this.events = params.events;

    this.root = new RootController(params.store);
    this.tagRegistry = Registry.getInstance();
    this.annotations = new AnnotationController(params.store);
  }

  hydrate(data: RootStoreInput) {
    this.hydrateRoot(data);
    this.hydrateAnnotations(data.task);
    this.parseConfig(data.config ?? '');
    this.annotations.selectFirstAnnotation();
  }

  get task() {
    return this.store.get(taskAtom);
  }

  get data() {
    return JSON.parse(this.task?.data ?? '{}');
  }

  private parseConfig(config: string) {
    this.tree = new ConfigTree({
      config: config ?? '',
      sdk: this,
    });

    this.tree.parse();
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
