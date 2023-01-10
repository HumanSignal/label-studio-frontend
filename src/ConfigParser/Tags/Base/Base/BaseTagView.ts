import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { FC } from 'react';
import { ConfigTree } from 'src/ConfigParser/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';
import { BaseTagController } from './BaseTagController';

export type BaseTagViewProps<Controller extends typeof BaseTagController, Props = {}> = Props & {
  tree: ConfigTree,
  node: ConfigTreeNode<Controller>,
  annotationAtom: AnnotationAtom,
  controller: InstanceType<Controller>,
  key?: string,
};

export type BaseTagView<
  Controller extends typeof BaseTagController,
  Props = {},
> = FC<BaseTagViewProps<Controller, Props>>
