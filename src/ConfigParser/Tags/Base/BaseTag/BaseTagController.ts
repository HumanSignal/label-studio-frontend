import * as TagViews from '@tags/AllViews';
import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';

type TagView = typeof TagViews[keyof typeof TagViews];

export type InternalTagType =
  | 'base-visual'
  | 'base'
  | 'view'
  | 'header'
  | 'labels'
  | 'label'
  | 'hypertextlabels';

export abstract class BaseTagControllerAbstract {
  static type: InternalTagType = 'base';

  static allowedChildrenTypes: InternalTagType[] = [];

  static allowChildren: boolean;

  abstract get type(): InternalTagType;

  private view: any;
}

export abstract class BaseTagController extends BaseTagControllerAbstract {
  static type: InternalTagType = 'base';

  static allowedChildrenTypes: InternalTagType[] = [];

  static allowChildren = true;

  private node: ConfigTreeNode;

  private static view: TagView;

  static setView(view: TagView) {
    this.view = view;
  }

  constructor(node: ConfigTreeNode) {
    super();
    this.node = node;
  }

  get type() {
    return (this.constructor as typeof BaseTagController).type as InternalTagType;
  }

  render() {
    return (this.constructor as typeof BaseTagController).view;
  }
}
