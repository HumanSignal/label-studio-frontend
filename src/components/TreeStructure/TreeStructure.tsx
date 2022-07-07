import React, { forwardRef, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList, VariableSizeList } from "react-window";

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
let heightAccumulator: { [key: string]: number } = {};
let visibleCounter = 0;
let visibleRendered = 0;
let scrollTimeout: NodeJS.Timeout | null = null;

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
  const [containerHeight, setContainerHeight] = useState(0);
  const [width, setWidth] = useState(minWidth);
  const listRef = useRef<RefObject<HTMLDivElement> | any>();
  const containerRef = useRef<RefObject<HTMLDivElement> | any>();
  const scrollableElement = containerRef.current?.firstChild;
  const scrollbarWidth = scrollableElement?.offsetWidth - scrollableElement?.clientWidth || 0;

  const invisibleListRef = useRef<RefObject<HTMLDivElement> | any>();

  const rowHeightCalc = (index: number): number => {
    return heightAccumulator[`${index}`] || rowHeight;
  };

  const rowHeightReCalcAll = () => {
    heightAccumulator = {};
    listRef.current.resetAfterIndex(0);
  };

  const containerHeightCalc = () => {
    listRef.current.resetAfterIndex(0);

    const visibleHeight = listRef.current?._outerRef.firstChild?.offsetHeight;
    const maxHeight = maxHeightPercentage * 0.01 * browserHeight;

    return visibleHeight > maxHeight ? maxHeight : visibleHeight;
  };

  const updateHeight = () => {
    setContainerHeight(containerHeightCalc());
  };

  const scrollToItemById = (id: string) => {
    const scrollToIndex = data?.findIndex(datum => datum.id === id);
    
    listRef.current.scrollToItem(scrollToIndex, "center");
  };

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
    setContainerHeight(maxHeightPercentage * 0.01 * browserHeight);
    rowHeightReCalcAll();
    scrollToItemById(id);

  };
  
  const onSelect = (id: string) => {
    scrollToItemById(id);
  };

  const addInside = (id?: string) => {
    if (id) {
      setData(recursiveTreeWalker({ items, addInsideId: id }));
      scrollToItemById(id);
    }
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
    const item = dataGetter(index);

    const dimensionCallback = useCallback((itemWidth: number, itemHeight: number) => {
      visibleCounter++;
      const key = `${index}`;

      if (width < itemWidth + scrollbarWidth) {
        if (maxWidth < itemWidth + scrollbarWidth) {
          heightAccumulator[key] = itemHeight;
          setWidth(maxWidth + scrollbarWidth);
        } else {
          heightAccumulator[key] = rowHeight;
          setWidth(itemWidth + scrollbarWidth);
        }
      } else heightAccumulator[key] = rowHeight;
      if (visibleCounter >= visibleRendered) {
        visibleCounter = 0;
        updateHeight();
      }
    }, [width]);

    return (
      <RowComponent {...{ item, style, dimensionCallback, maxWidth }} />
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

  const scrollHandler = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => updateHeight(), 200);
  };

  const outerElement = forwardRef((props: any, ref) => {
    visibleRendered = props.children.props.children.length;
    const amendedProps = {
      ...props,
      onScroll: (e: any) => {
        props.onScroll(e);
        scrollHandler();
      },
      style: { ...props.style, overflow: "hidden", overflowY: "auto" },
    };

    return <div ref={ref} {...amendedProps} />;
  });

  useEffect(() => {
    setData(recursiveTreeWalker({ items }));
    return () => {
      visibleCounter = 0;
    };
  }, [items]);

  useEffect(() => {
    if (data?.length === 0) updateHeight();
  }, [data]);

  return (
    <div ref={containerRef}>
      <VariableSizeList
        ref={listRef}
        height={containerHeight + 4}
        itemCount={data?.length || 0}
        itemSize={rowHeightCalc}
        width={width + scrollbarWidth}
        outerElementType={outerElement}
        itemData={(index: number) => ({ row: data && data[index], toggle, onSelect, addInside })}
      >
        {({ data, index, style }) => <Row data={data} rowStyle={style} index={index} rowComponent={rowComponent} />}
      </VariableSizeList>
      {/* <FixedSizeList
        // style={{ width: 'fit-content' }}
        ref={invisibleListRef}
        height={containerHeight + 4}
        itemCount={data?.length || 0}
        width={maxWidth}
        itemSize={rowHeight}
        outerElementType={outerElement}
        itemData={(index: number) => ({ row: data && data[index], toggle, addInside })}
      >
        {({ data, index, style }) => <Row data={data} rowStyle={style} index={index} rowComponent={rowComponent} />}
      </FixedSizeList> */}
    </div>
  );
};

export default TreeStructure;
