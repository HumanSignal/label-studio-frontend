import { Annotation } from '@atoms/Models/AnnotationsAtom/Types';
import { Atom } from 'jotai';
import { FC } from 'react';
import { ConfigTree } from 'src/core/ConfigTree/ConfigTree';
import { ConfigTreeNode } from 'src/core/ConfigTree/ConfigTreeNode';

export type BaseTagViewProps = {
  tree: ConfigTree,
  node: ConfigTreeNode,
  annotationEntity: Atom<Annotation>,
}

export type BaseTagView<Props = unknown> = FC<Props & BaseTagViewProps>
