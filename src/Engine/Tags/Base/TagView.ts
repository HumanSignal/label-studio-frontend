import { FC } from 'react';
import { AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
import { ConfigTree } from 'src/Engine/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/Engine/ConfigTree/ConfigTreeNode';
import { TagController } from './TagController';

export type TagViewProps<Controller extends typeof TagController, Props = {}> = Props & {
  tree: ConfigTree,
  node: ConfigTreeNode,
  annotationAtom: AnnotationAtom,
  controller: InstanceType<Controller>,
  key?: string,
};

export type TagView<
  Controller extends typeof TagController,
  Props = {},
> = FC<TagViewProps<Controller, Props>>
