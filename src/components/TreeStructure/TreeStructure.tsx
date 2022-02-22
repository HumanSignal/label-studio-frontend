import React, { RefObject, useEffect,  useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';

type ExtendedData = Readonly<{
  id: string,
  isLeaf: boolean,
  name: string,
  nestingLevel: number,
  padding: number,
  path: string[],
}>;


export interface ExtendedDataWithToggle extends ExtendedData {
  toggle: (id: string) => void;
}

export interface RowProps  { 
  data: ExtendedData;
  style: any; 
}

export interface RowItem { 
  children?: RowItem[];
  label: string;
  depth: number; 
  path: string[];
  isOpen: boolean;
}

type transformationCallback = (
  { node,
    nestingLevel,
    isFiltering,
    isLeaf,
    childCount,
    isOpen,
  }:
  {
    node: RowItem, 
    nestingLevel: number, 
    isOpen: boolean, 
    isFiltering: boolean, 
    isLeaf: boolean,
    childCount: number | undefined,
  }) => ExtendedData

const countChildNodes = (item: RowItem[]) => 
{
  let counter = 0;
  let index = item.length;

  while (index--)
  {
    counter++;
    const children = item[index].children;

    if (children) counter += countChildNodes(children);
  }
  return counter;
};

const blankItem: RowItem = ({ label: '', depth: 0, path: [], isOpen: true });


const TreeStructure =  (
  { items, rowComponent, flatten, rowHeight, maxHeightPersentage, minWidth, transformationCallback, defaultExpanded }: 
  { items: any[], 
    rowComponent: React.FC, 
    flatten: boolean, 
    rowHeight: number, 
    maxHeightPersentage: number,
    minWidth: number,
    defaultExpanded: boolean,
    transformationCallback: transformationCallback,
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

  const toggle = (id: string) => {
    const toggleItem = { [id]: openNodes[id] !== 2 ? 2 : 1 };
    
    setOpenNodes({ ...openNodes, ...toggleItem });
    setData(recursiveTreeWalker({ items, toggleItem }));
    updateHeight();
  };

  const addInside = (id?: string) => {
    if (id) setData(recursiveTreeWalker({ items, addInsideId: id }));
    else setData(recursiveTreeWalker({ items }));
    updateHeight();
  };

  const recursiveTreeWalker = (
    {
      items,
      depth,
      toggleItem,
      addInsideId,
    }:
    {
      items: RowItem[], 
      depth?: number,
      toggleItem?: {[key: string]: number},
      addInsideId?: string,
    }, 
  ) => {
    const stack: ExtendedData[] = [];

    for (let i = 0; i < items.length; i++) {
      const { children, label } = items[i];
      const definedDepth = depth || 0;  
      const id = `${label}-${definedDepth}`;
      const isOpen = toggleItem && toggleItem[id] || 
        openNodes[id] || 
        (defaultExpanded ? 1 : 2);
      
      const transformedData: ExtendedData = transformationCallback({ 
        node: items[i], 
        nestingLevel: flatten ? 0 : definedDepth,
        isFiltering: flatten,
        isLeaf: !children,
        childCount: children && countChildNodes(children),
        isOpen: isOpen === 1,
      });

      if( children && (isOpen === 1 || flatten)) {
        stack.push(
          { ...transformedData }, 
          ...recursiveTreeWalker({ items: children, depth: definedDepth + 1 , toggleItem, addInsideId }));
      } 
      else stack.push({ ...transformedData } );
      if (addInsideId === id){
        stack.push(...recursiveTreeWalker({ items: [blankItem], depth: definedDepth + 1 }));

      }
    }
    return stack;
  };

  useEffect(() => {setData(recursiveTreeWalker({ items }));}, [items]);
  useEffect(()=> updateHeight(), [data]);

  return (
    <div ref={containerRef}>
      <FixedSizeList
        height={height}
        itemCount={data?.length || 0}
        itemSize={rowHeight}
        width={containerRef?.current?.offsetWidth || minWidth}
        itemData={(index:number)=> ({ row: data && data[index], toggle, addInside }) }
      >
        {rowComponent}
      </FixedSizeList>     
    </div>       

  );
};


export default TreeStructure;
