import React, { RefObject, useLayoutEffect, useRef, useState } from 'react';
import { FixedSizeNodeData, FixedSizeTree  } from 'react-vtree';

type ExtendedData = FixedSizeNodeData &
Readonly<{
  id:string,
  isLeaf: boolean,
  name: string,
  nestingLevel: number,
  padding: number,
  path: string[],
}>;

export interface ExtendedDataWithRefresh extends ExtendedData {
  updateHeight: () => void;
}

export interface RowProps  { 
  data: ExtendedDataWithRefresh;
  isOpen: boolean;
  style: any; 
  toggle: () => Promise<boolean>;
}

export interface RowItem { 
  children?:RowItem[];
  label:string;
  depth:number; 
  path: string[];
}

type transformationCallback = (
  { node, nestingLevel }:
  {node: RowItem, nestingLevel:number}) => ExtendedData

const TreeStructure =  (
  { items, rowComponent, flatten, rowHeight, maxHeightPersentage, transformationCallback }: 
  { items:any[], 
    rowComponent: React.FC, 
    flatten:boolean, 
    rowHeight: number, 
    maxHeightPersentage: number,
    transformationCallback:transformationCallback,
  })=> {
  
  const browserHeight = document.body.clientHeight;

   
  const [height, setHeight] = useState(0);
  const containerRef = useRef<RefObject<HTMLDivElement> | any>();

  const calcHeight = () => {
    const visibleHeight = containerRef.current.state.order.length * rowHeight;
    const maxHeight = maxHeightPersentage * .01 * browserHeight;

    return visibleHeight > maxHeight ?  maxHeight : visibleHeight;
  };

  const updateHeight = () => setHeight(calcHeight());

  useLayoutEffect(()=> updateHeight(), [items]);

  function* treeWalker(refresh: boolean):  
  Generator<ExtendedDataWithRefresh | string | symbol, void, boolean> {
    const stack: any[] = [];
    
    for (let i = items.length -1; i >= 0; i--) {
      stack.push({
        nestingLevel: flatten ? 0 : items[i].depth,
        node: items[i],
      });
    }

    while (stack.length !== 0) {
      const { node, nestingLevel } = stack.pop();
      const flatLevil: number = flatten ? 0 : nestingLevel;

      const transformedData: ExtendedData = transformationCallback({ node, nestingLevel: flatLevil });
      const refreshAddedData: ExtendedDataWithRefresh = { ...transformedData, updateHeight };

      const isOpened = yield refresh
        ? refreshAddedData
        : transformedData.id;

      if (node.children?.length !== 0 && isOpened) {
        for (let i = node.children?.length - 1; i >= 0; i--) {
          stack.push({
            nestingLevel: nestingLevel + 1,
            node: node.children[i],
          });
        }
      }
    }
  }
  
  return (
    <FixedSizeTree ref={containerRef} treeWalker={treeWalker} itemSize={rowHeight} height={height}>
      {rowComponent}
    </FixedSizeTree>        
  );
};


export default TreeStructure;

