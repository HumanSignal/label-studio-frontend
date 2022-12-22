import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { FC } from 'react';
import { ConfigTree } from 'src/ConfigParser/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/ConfigParser/ConfigTree/ConfigTreeNode';

export type BaseTagViewProps = {
  tree: ConfigTree,
  node: ConfigTreeNode,
  annotationAtom: AnnotationAtom,
  key?: string,
}

export type BaseTagView<Props = unknown> = FC<Props & BaseTagViewProps>
