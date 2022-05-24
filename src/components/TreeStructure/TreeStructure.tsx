import React, { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList } from "react-window";

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

export interface RowProps {
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

type transformationCallback = ({
  node,
  nestingLevel,
  isFiltering,
  isLeaf,
  childCount,
  isOpen,
}: {
  node: RowItem,
  nestingLevel: number,
  isOpen: boolean,
  isFiltering: boolean,
  isLeaf: boolean,
  childCount: number | undefined,
}) => ExtendedData;

const countChildNodes = (item: RowItem[]) => {
  let counter = 0;
  let index = item.length;

  while (index--) {
    counter++;
    const children = item[index].children;

    if (children) counter += countChildNodes(children);
  }
  return counter;
};

const blankItem = (path: string[], depth: number): RowItem => ({ label: "", depth, path, isOpen: true });



const TreeStructure = ({
  items,
  rowComponent,
  flatten,
  rowHeight,
  maxHeightPercentage,
  minWidth,
  maxWidth,
  transformationCallback,
  defaultExpanded,
}: {
  items: any[],
  rowComponent: React.FC<any>,
  flatten: boolean,
  rowHeight: number,
  maxHeightPercentage: number,
  minWidth: number,
  maxWidth: number,
  defaultExpanded: boolean,
  transformationCallback: transformationCallback,
}) => {
  const browserHeight = document.body.clientHeight;

  const [data, setData] = useState<ExtendedData[]>();
  const [openNodes, setOpenNodes] = useState<{ [key: string]: number }>({});
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(minWidth);
  const containerRef = useRef<RefObject<HTMLDivElement> | any>();

  const calcHeight = () => {
    const visibleHeight = (data?.length || 0) * rowHeight;
    const maxHeight = maxHeightPercentage * 0.01 * browserHeight;

    return visibleHeight > maxHeight ? maxHeight : visibleHeight;
  };

  const updateHeight = () => setHeight(calcHeight());


  const toggle = (id: string) => {
    const toggleItem = defaultExpanded
      ? {
        [id]: openNodes[id] !== 2 ? 2 : 1,
      }
      : {
        [id]: openNodes[id] !== 1 ? 1 : 2,
      };

    setOpenNodes({ ...openNodes, ...toggleItem });
    setData(recursiveTreeWalker({ items, toggleItem }));
    updateHeight();
  };

  const addInside = (id?: string) => {
    if (id) setData(recursiveTreeWalker({ items, addInsideId: id }));
    else setData(recursiveTreeWalker({ items }));
    updateHeight();
  };

  const Row = ({
    data: dataGetter,
    index,
    rowStyle: style,
    rowComponent: RowComponent,
  }: {
    data: (
      index: number,
    ) => {
      row:
      | Readonly<{
        id: string,
        isLeaf: boolean,
        name: string,
        nestingLevel: number,
        padding: number,
        path: string[],
      }>
      | undefined,
    },
    index: number,
    rowStyle: any,
    rowComponent: React.FC<any>,
  }) => {
    const rowRef = useRef<RefObject<HTMLDivElement> | any>();

    useEffect(() => {
      const itemWidth = rowRef.current?.firstChild?.scrollWidth;

      if (width < itemWidth) {
        if (maxWidth < itemWidth) {
          setWidth(maxWidth);
        } else setWidth(itemWidth);
      }
    }, []);
    const item = dataGetter(index);

    return (
      <div ref={rowRef}>
        <RowComponent {...{ item, style }} />
      </div>
    );
  };
  const recursiveTreeWalker = ({
    items,
    depth,
    toggleItem,
    addInsideId,
  }: {
    items: RowItem[],
    depth?: number,
    toggleItem?: { [key: string]: number },
    addInsideId?: string,
  }) => {
    const stack: ExtendedData[] = [];

    for (let i = 0; i < items.length; i++) {
      const { children, label } = items[i];
      const definedDepth = depth || 0;
      const id = `${label}-${definedDepth}`;
      const addInside = addInsideId === id;
      const isOpen = (toggleItem && toggleItem[id]) || openNodes[id] || addInside || (defaultExpanded ? 1 : 2);

      const transformedData: ExtendedData = transformationCallback({
        node: items[i],
        nestingLevel: definedDepth,
        isFiltering: flatten,
        isLeaf: !children,
        childCount: children && countChildNodes(children),
        isOpen: isOpen === 1,
      });

      addInside && setOpenNodes({ ...openNodes, [id]: 1 });

      if ((children && isOpen === 1) || addInside || flatten) {
        stack.push({ ...transformedData });
        addInside &&
          stack.push(
            ...recursiveTreeWalker({ items: [blankItem(items[i].path, definedDepth + 1)], depth: definedDepth + 1 }),
          );
        children &&
          stack.push(...recursiveTreeWalker({ items: children, depth: definedDepth + 1, toggleItem, addInsideId }));
      } else stack.push({ ...transformedData });
    }
    return stack;
  };

  useEffect(() => {
    setData(recursiveTreeWalker({ items }));
  }, [items]);
  useEffect(() => updateHeight(), [data]);

  return (
    <FixedSizeList
      ref={containerRef}
      height={height}
      itemCount={data?.length || 0}
      itemSize={rowHeight}
      width={width}
      itemData={(index: number) => ({ row: data && data[index], toggle, addInside })}
    >
      {({ data, index, style }) => <Row data={data} rowStyle={style} index={index} rowComponent={rowComponent} />}
    </FixedSizeList>
  );
};

export default TreeStructure;
