import { ConfigTreeNode } from 'src/core/ConfigTree/ConfigTreeNode';

export type InternalTagType =
  | 'base'
  | 'view'
  | 'header'
  | 'base-visual';

export abstract class BaseTagControllerAbstract {
  static type: InternalTagType = 'base';

  static allowedChildrenTypes: InternalTagType[] = [];

  static allowChildren: boolean;

  abstract get type(): InternalTagType;
}

export class BaseTagController extends BaseTagControllerAbstract {
  static type: InternalTagType = 'base';

  static allowedChildrenTypes: InternalTagType[] = [];

  static allowChildren = true;

  private node: ConfigTreeNode;

  constructor(node: ConfigTreeNode) {
    super();
    this.node = node;
  }

  get type() {
    return (this.constructor as typeof BaseTagController).type as InternalTagType;
  }
}
