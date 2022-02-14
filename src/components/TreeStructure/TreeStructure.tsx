import React, { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';

type ExtendedData = Readonly<{
  id:string,
  isLeaf: boolean,
  name: string,
  nestingLevel: number,
  padding: number,
  path: string[],
  isOpen: boolean,
}>;

export interface ExtendedDataWithToggle extends ExtendedData {
  toggle: (index: number) => void;
}

export interface RowProps  { 
  data: ExtendedData;
  style: any; 
  toggle: (index: number) => Promise<boolean>;
}

export interface RowItem { 
  children?: RowItem[];
  label: string;
  depth: number; 
  path: string[];
  isOpen: boolean;
}

type transformationCallback = (
  { node, nestingLevel }:
  {node: RowItem, nestingLevel:number, isOpen: boolean}) => ExtendedData

const TreeStructure =  (
  { items, rowComponent, flatten, rowHeight, maxHeightPersentage, transformationCallback, defaultExpanded }: 
  { items:any[], 
    rowComponent: React.FC, 
    flatten:boolean, 
    rowHeight: number, 
    maxHeightPersentage: number,
    defaultExpanded:boolean,
    transformationCallback:transformationCallback,
  })=> {
  
  const browserHeight = document.body.clientHeight;

  const [data, setData] = useState<ExtendedData[]>();   
  const [openNodes, setOpenNodes]= useState<{[key: string]: number }>({});
  const [height, setHeight] = useState(0);
  const containerRef = useRef<RefObject<HTMLDivElement> | any>();

  const calcHeight = () => {
    const visibleHeight = (data?.length || 0) * rowHeight;
    const maxHeight = maxHeightPersentage * .01 * browserHeight;

    return visibleHeight > maxHeight ?  maxHeight : visibleHeight;
  };

  const updateHeight = () => setHeight(calcHeight());

  const toggle = (index: number) => {
    const toggledInsance = { [index]: openNodes[index] !== 2 ? 2 : 1 };

    setOpenNodes({ ...openNodes, ...toggledInsance });
    setData(recursiveTreeWalker(items, toggledInsance));
    updateHeight();
  };

  const recursiveTreeWalker = (items: RowItem[], toggleItem?: {[key: string]: number})=> {
    const stack: ExtendedData[] = [];

    for (let i = 0; i <= items.length -1; i++) {
      const children = items[i].children;
      const isOpen = toggleItem && toggleItem[i] || openNodes[i] || (defaultExpanded ? 1 : 2);

      const transformedData: ExtendedData = transformationCallback({ 
        node: items[i], 
        nestingLevel: flatten ? 0 : items[i].depth,
        isOpen: isOpen === 1,
      });

      if(children && isOpen === 1) {
        stack.push({ ...transformedData }, ...recursiveTreeWalker(children));
      } else stack.push({ ...transformedData });
    }
    return stack; 
  };

  useEffect(() => {setData(recursiveTreeWalker(items));}, [items]);
  useEffect(()=> updateHeight(), [data]);

  return (
    <div ref={containerRef}>
      <FixedSizeList
        height={height}
        itemCount={data?.length || 0}
        itemSize={rowHeight}
        width={containerRef?.current?.offsetWidth || 200}
        itemData={{ ...data, toggle }}
      >
        {rowComponent}
      </FixedSizeList>     
    </div>       

  );
};


export default TreeStructure;

