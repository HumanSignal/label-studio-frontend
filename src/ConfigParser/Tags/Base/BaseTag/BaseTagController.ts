import * as TagViews from '@tags/AllViews';
import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';

type TagView = typeof TagViews[keyof typeof TagViews];

export enum TagType {
  /* @private */
  'baseVisual' = 'base-visual',
  'base' = 'base',
  'view' = 'view',
  'header' = 'header',
  'labels' = 'labels',
  'label' = 'label',
  'hypertextlabels' = 'hypertextlabels',
}

export abstract class BaseTagControllerAbstract {
  static type = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren: boolean;

  abstract get type(): TagType;

  private view: any;
}

export abstract class BaseTagController extends BaseTagControllerAbstract {
  static type = TagType.base;

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
    return (this.constructor as typeof BaseTagController).type as TagType;
  }

  render() {
    return (this.constructor as typeof BaseTagController).view;
  }
}
