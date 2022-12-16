import { RootStoreInput } from '@atoms/Inputs/RootStore';
import { TaskInput } from '@atoms/Inputs/TaskInput';
import { AnnotationModel } from '@atoms/Models/AnnotationsAtom/Model';
import { RootModel } from '@atoms/Models/RootAtom/Model';
import { Store } from '@atoms/Store';
import { StoreAccess } from '@atoms/StoreAccess';
import { ConfigTree } from 'src/core/ConfigTree/ConfigTree';

class InternalSDK extends StoreAccess {
  root: RootModel;
  annotations: AnnotationModel;
  tree!: ConfigTree;

  constructor(store: Store) {
    super(store);
    this.root = new RootModel(store);
    this.annotations = new AnnotationModel(store);
  }

  hydrate(data: RootStoreInput) {
    console.log('RootStoreInput');

    this.hydrateRoot(data);
    this.hydrateAnnotations(data.task);
    this.tree = new ConfigTree(data.config ?? '');
    this.tree.parse();

    this.tree.walkTree(node => console.log(node));
    this.annotations.selectFirstAnnotation();
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
