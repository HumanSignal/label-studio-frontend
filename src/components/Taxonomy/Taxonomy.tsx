import React, { FormEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown, Menu } from "antd";

import { useToggle } from "../../hooks/useToggle";
import { isArraysEqual } from "../../utils/utilities";
import { LsChevron } from "../../assets/icons";
import TreeStructure, { RowItem } from "../TreeStructure/TreeStructure";

import styles from "./Taxonomy.module.scss";

type TaxonomyPath = string[]
type onAddLabelCallback = (path: string[]) => any
type onDeleteLabelCallback = (path: string[]) => any

type TaxonomyItem = {
  label: string,
  path: TaxonomyPath,
  depth: number,
  children?: TaxonomyItem[],
  origin?: "config" | "user" | "session",
}

type TaxonomyOptions = {
  leafsOnly?: boolean,
  showFullPath?: boolean,
  pathSeparator?: string,
  maxUsages?: number,
  placeholder?: string,
}

type TaxonomyOptionsContextValue = TaxonomyOptions & {
  onAddLabel?: onAddLabelCallback,
  onDeleteLabel?: onDeleteLabelCallback,
  maxUsagesReached?: boolean,
}

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: TaxonomyPath[],
  onChange: (node: any, selected: TaxonomyPath[]) => any,
  onAddLabel?: onAddLabelCallback,
  onDeleteLabel?: onDeleteLabelCallback,
  options?: TaxonomyOptions,
}

type TaxonomySelectedContextValue = [
  TaxonomyPath[],
  (path: TaxonomyPath, value: boolean) => any,
]

const TaxonomySelectedContext = React.createContext<TaxonomySelectedContextValue>([[], () => undefined]);
const TaxonomyOptionsContext = React.createContext<TaxonomyOptionsContextValue>({});

type UserLabelFormProps = {
  onAddLabel: (path: string[]) => any,
  onFinish?: () => any,
  path: string[],
  
}

interface RowProps {
  style: any;
  index: number;
  data: (index: number) => { 
    row: { 
      id: string,
      isOpen: boolean, 
      path: string[], 
      childCount: number, 
      isFiltering: boolean, 
      name: string, 
      padding: number, 
      isLeaf: boolean,
    },
    origin?: any,
    children?: any,
    toggle: (id: string) => void,
    addInside: (id?: string) => void,
  };
}

const UserLabelForm = ({ onAddLabel, onFinish, path }: UserLabelFormProps) => {
  const addRef = useRef<HTMLInputElement>(null);
  const onAdd = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent) => {
    if (!addRef.current) return;

    const value = addRef.current.value;
    const isEscape = "key" in e && e.key === "Escape";
    const isEnter = "key" in e && e.key === "Enter";
    const isBlur = e.type === "blur";

    if (isEscape) e.stopPropagation();

    // just do nothing, maybe misclick
    if (isEnter && !value) return;

    if ((isBlur || isEnter) && value) onAddLabel([...path, value]);

    // event fires on every key, so important to check
    if (isBlur || isEnter || isEscape) {
      addRef.current.value = "";
      onFinish?.();
    }
  };

  // autofocus; this also allows to close form on every action, because of blur event
  useEffect(() => addRef.current?.focus(), []);

  return (
    <div className={styles.taxonomy__newitem}>
      <input name="taxonomy__add" onKeyDownCapture={onAdd} onBlur={onAdd} ref={addRef} />
    </div>
  );
};

const SelectedList = () => {
  const [selected, setSelected] = useContext(TaxonomySelectedContext);
  const { showFullPath, pathSeparator = " / " } = useContext(TaxonomyOptionsContext);

  return (
    <div className={styles.taxonomy__selected}>
      {selected.map(path => (
        <div key={path.join("|")}>
          {showFullPath ? path.join(pathSeparator) : path[path.length - 1]}
          <input type="button" onClick={() => setSelected(path, false)} value="×" />
        </div>
      ))}
    </div>
  );
};

// check if item is child of parent (i.e. parent is leading subset of item)
function isSubArray(item: string[], parent: string[]) {
  if (item.length <= parent.length) return false;
  return parent.every((n, i) => item[i] === n);
}


// @todo change `flat` into `alwaysOpen` and move it to context
const Item: React.FC<any> = (props: RowProps) => {
  const { style, data, index } = props; 
  const item = data(index);
  const { row: { id, isOpen, childCount, isFiltering, name, path, padding, isLeaf }, toggle, addInside: addChild } = item;
  
  const [selected, setSelected] = useContext(TaxonomySelectedContext);
  const { leafsOnly, maxUsages, maxUsagesReached, onAddLabel, onDeleteLabel } = useContext(TaxonomyOptionsContext);
  
  const checked = selected.some(current => isArraysEqual(current, path));
  const isChildSelected = selected.some(current => isSubArray(current, path));
  const hasChilds = !isLeaf;
  const onlyLeafsAllowed = leafsOnly && hasChilds;
  const limitReached = maxUsagesReached && !checked;
  const disabled = onlyLeafsAllowed || limitReached;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, open] = useToggle(isChildSelected || isFiltering);
  const onClick = () => leafsOnly && toggle(id);
  const arrowStyle = !isLeaf
    ? { transform: isOpen ? "rotate(180deg)" : "rotate(90deg)" }
    : { display: "none" };

  const [isAdding, addInside, closeForm] = useToggle(false);

  useEffect(() => {
    if (isFiltering || isAdding || isChildSelected) open();
  }, [isFiltering, isAdding, isChildSelected]);

  const title = onlyLeafsAllowed
    ? "Only leaf nodes allowed"
    : (limitReached ? `Maximum ${maxUsages} items already selected` : undefined);

  const setIndeterminate = useCallback(el => {
    if (!el) return;
    if (checked) el.indeterminate = false;
    else el.indeterminate = isChildSelected;
  }, [checked, isChildSelected]);

  const onDelete = useCallback(
    () => onDeleteLabel?.(path),
    [item, onDeleteLabel],
  );

  const customClassname = item.origin === "session"
    ? styles.taxonomy__item_session
    : (item.origin === "user" ? styles.taxonomy__item_user : "");


  return (
    <div style={{ paddingLeft: padding, ...style }}>
      <div className={[styles.taxonomy__item, customClassname].join(" ")}>
        { !isFiltering && (
          <div className={styles.taxonomy__grouping} onClick={()=> toggle(id)}>
            <LsChevron stroke="#09f" style={arrowStyle} />
          </div>
        )}
        <label
          onClick={onClick}
          title={title}
          className={disabled ? styles.taxonomy__collapsable : undefined}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={checked}
            ref={setIndeterminate}
            onChange={e => setSelected(path, e.currentTarget.checked)}
          />
          {name}
        </label>
        {!isFiltering && (
          <div className={styles.taxonomy__extra}>
            <span className={styles.taxonomy__extra_count}>
              {childCount}
            </span>
            {onAddLabel && (
              <div className={styles.taxonomy__extra_actions}>
                <Dropdown
                  destroyPopupOnHide // important for long interactions with huge taxonomy
                  trigger={["click"]}
                  overlay={(
                    <Menu>
                      <Menu.Item
                        key="add-inside"
                        className={styles.taxonomy__action}
                        onClick={()=> { addChild(id); addInside();}}
                      >Add Inside</Menu.Item>
                      {item.origin === "session" && (
                        <Menu.Item
                          key="delete"
                          className={styles.taxonomy__action}
                          onClick={()=> { addChild(); onDelete();}}
                        >Delete</Menu.Item>
                      )}
                    </Menu>
                  )}
                >
                  <div>
                    ...
                  </div>
                </Dropdown>
              </div>
            )}
          </div>
        )}
      </div>
      {isAdding && onAddLabel && 
        <UserLabelForm key="" onAddLabel={onAddLabel} onFinish={closeForm} path={path} />
      }
    </div>
  );
};

type TaxonomyDropdownProps = {
  dropdownRef: React.Ref<HTMLDivElement>,
  flatten: TaxonomyItem[],
  items: TaxonomyItem[],
  show: boolean,
}

const filterTreeByPredicate = (
  flatten: TaxonomyItem[],
  predicate: (item: TaxonomyItem) => boolean,
) => {
  const roots: TaxonomyItem[] = [];
  const childs: TaxonomyItem[][] = [];
  let d = -1;

  for (let i = flatten.length; i--; ) {
    const item = flatten[i];

    if (item.depth === d) {
      const adjusted: TaxonomyItem = { ...item, children: childs[d] ?? [] };

      childs[d] = [];
      if (d) {
        if (!childs[d - 1]) childs[d - 1] = [];
        childs[d - 1].unshift(adjusted);
      } else {
        roots.unshift(adjusted);
      }
      d--;
      continue;
    }

    if (predicate(item)) {
      const adjusted = { ...item, children: [] };

      if (item.depth === 0) {
        roots.unshift(adjusted);
      } else {
        d = item.depth - 1;
        if (!childs[d]) childs[d] = [];
        childs[d].unshift(adjusted);
      }
    }
  }

  return roots;
};

const TaxonomyDropdown = ({ show, flatten, items, dropdownRef }: TaxonomyDropdownProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const predicate = (item: TaxonomyItem) => item.label.toLocaleLowerCase().includes(search);
  const onInput = (e: FormEvent<HTMLInputElement>) => setSearch(e.currentTarget.value.toLocaleLowerCase());
  const { onAddLabel } = useContext(TaxonomyOptionsContext);
  const [isAdding, addInside, closeForm] = useToggle(false);

  const list = search ? filterTreeByPredicate(flatten, predicate) : items;

  useEffect(() => {
    const input = inputRef.current;

    if (show && input) {
      input.value = "";
      input.focus();
      setSearch("");
    }
  }, [show]);

  const itemDataReformater = (
    { node: { children, label, depth, path }, nestingLevel, isFiltering, isOpen, childCount } :
    { node: RowItem, nestingLevel: number, isFiltering: boolean, isOpen: boolean, childCount: number | undefined,
    }) => (
    {
      id: `${label}-${depth}`,
      isLeaf: !children?.length,
      isOpenByDefault: true,
      name: label,
      childCount,
      nestingLevel,
      padding: nestingLevel * 10 + 10,
      isFiltering,
      isOpen,
      path,
    }
  );

  return (
    <div className={styles.taxonomy__dropdown} ref={dropdownRef} style={{ display: show ? "block" : "none" }}>
      <input
        autoComplete="off"
        className={styles.taxonomy__search}
        name="taxonomy__search"
        placeholder="Search..."
        onInput={onInput}
        ref={inputRef}
      />
      {show && (
        <TreeStructure 
          items={list} 
          rowComponent={Item} 
          flatten={search !== ""} 
          rowHeight={30}
          defaultExpanded={true}
          maxHeightPersentage={50}
          minWidth={300}
          transformationCallback={itemDataReformater}
        />
      )}
      {onAddLabel && search === "" && (
        isAdding
          ? <UserLabelForm path={[]} onAddLabel={onAddLabel} onFinish={closeForm} />
          : <div className={styles.taxonomy__add}><button onClick={addInside}>Add</button></div>
      )}
    </div>
  );
};

const Taxonomy = ({ items, selected: externalSelected, onChange, onAddLabel, onDeleteLabel, options = {} }: TaxonomyProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const taxonomyRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const onClickOutside = useCallback(e => {
    const cn = styles.taxonomy__action;

    // don't close dropdown if user clicks on action from context menu
    if ([e.target, e.target.parentNode].some(n => n?.classList?.contains(cn))) return;
    if (!taxonomyRef.current?.contains(e.target)) close();
  }, []);
  const onEsc = useCallback(e => {
    if (e.key === "Escape") {
      close();
      e.stopPropagation();
    }
  }, []);

  const isOpenClassName = isOpen ? styles.taxonomy_open : "";

  const flatten = useMemo(() => {
    const flatten: TaxonomyItem[] = [];
    const visitItem = (item: TaxonomyItem) => {
      flatten.push(item);
      item.children?.forEach(visitItem);
    };

    items.forEach(visitItem);
    return flatten;
  }, [items]);

  const [selected, setInternalSelected] = useState(externalSelected);
  const contextValue: TaxonomySelectedContextValue = useMemo(() => {
    const setSelected = (path: TaxonomyPath, value: boolean) => {
      const newSelected = value
        ? [...selected, path]
        : selected.filter(current => !isArraysEqual(current, path));

      setInternalSelected(newSelected);
      onChange && onChange(null, newSelected);
    };

    return [selected, setSelected];
  }, [selected]);

  const optionsWithMaxUsages = useMemo(() => {
    const maxUsagesReached = options.maxUsages ? selected.length >= options.maxUsages : false;

    return { ...options, maxUsagesReached, onAddLabel, onDeleteLabel };
  }, [options, options.maxUsages, options.maxUsages ? selected : 0]);

  useEffect(() => {
    setInternalSelected(externalSelected);
  }, [externalSelected]);

  useEffect(() => {
    if (isOpen) {
      document.body.addEventListener("click", onClickOutside, true);
      document.body.addEventListener("keydown", onEsc);
    } else {
      document.body.removeEventListener("click", onClickOutside);
      document.body.removeEventListener("keydown", onEsc);
    }
  }, [isOpen]);

  return (
    <TaxonomySelectedContext.Provider value={contextValue}>
      <TaxonomyOptionsContext.Provider value={optionsWithMaxUsages}>
        <SelectedList />
        <div className={[styles.taxonomy, isOpenClassName].join(" ")} ref={taxonomyRef}>
          <span onClick={() => setOpen(val => !val)}>
            {options.placeholder || "Click to add..."}
            <LsChevron stroke="#09f" />
          </span>
          <TaxonomyDropdown show={isOpen} items={items} flatten={flatten} dropdownRef={dropdownRef} />
        </div>
      </TaxonomyOptionsContext.Provider>
    </TaxonomySelectedContext.Provider>
  );
};

export { Taxonomy };