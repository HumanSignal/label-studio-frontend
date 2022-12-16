import { RootStoreInput } from '@atoms/Inputs/RootStore';
import { TaskInput } from '@atoms/Inputs/TaskInput';
import { AnnotationController } from '@atoms/Models/AnnotationsAtom/Controller';
import { RootController } from '@atoms/Models/RootAtom/Controller';
import { Store } from '@atoms/Store';
import { StoreAccess } from '@atoms/StoreAccess';
import { TagRegistry } from '@tags/Registry';
import { ConfigTree } from 'src/core/ConfigTree/ConfigTree';

class InternalSDK extends StoreAccess {
  root: RootController;
  annotations: AnnotationController;
  tagRegistry: TagRegistry;
  tree!: ConfigTree;

  constructor(store: Store) {
    super(store);
    this.root = new RootController(store);
    this.tagRegistry = TagRegistry.getInstance();
    this.annotations = new AnnotationController(store);
  }

  hydrate(data: RootStoreInput) {
    console.log('RootStoreInput');

    this.hydrateRoot(data);
    this.hydrateAnnotations(data.task);
    this.parseConfig(data.config ?? '');
    this.annotations.selectFirstAnnotation();
  }

  private parseConfig(config: string) {
    this.tree = new ConfigTree(config ?? '');

    this.tree.parse();
    this.tree.walkTree(node => console.log(node));
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
