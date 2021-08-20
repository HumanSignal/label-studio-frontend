import React, { useState, useCallback, useEffect, useRef, useMemo, useContext, FormEvent } from "react";

import { useToggle } from "../../hooks/useToggle";
import { isArraysEqual } from "../../utils/utilities";

import styles from "./Taxonomy.module.scss";

type TaxonomyPath = string[]

type TaxonomyItem = {
  label: string,
  path: TaxonomyPath,
  children?: TaxonomyItem[],
}

type TaxonomyOptions = {
  leafsOnly?: boolean,
  showFullPath?: boolean,
  pathSeparator?: string,
}

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: TaxonomyPath[],
  onChange: (node: any, selected: TaxonomyPath[]) => any,
  options?: TaxonomyOptions,
}

type TaxonomySelectedContextValue = [
  TaxonomyPath[],
  (path: TaxonomyPath, value: boolean) => any,
]

const TaxonomySelectedContext = React.createContext<TaxonomySelectedContextValue>([[], () => undefined]);
const TaxonomyOptionsContext = React.createContext<TaxonomyOptions>({});

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

const Item = ({ item }: { item: TaxonomyItem }) => {
  const [selected, setSelected] = useContext(TaxonomySelectedContext);
  const { leafsOnly } = useContext(TaxonomyOptionsContext);
  const [isOpen, , , toggle] = useToggle();
  const prefix = item.children?.length ? (isOpen ? "-" : "+") : " ";
  const onClick = () => leafsOnly && toggle();

  return (
    <div>
      <div className={styles.taxonomy__item}>
        <div className={styles.taxonomy__grouping} onClick={toggle}>{prefix}</div>
        <label onClick={onClick}>
          <input
            type="checkbox"
            disabled={leafsOnly && Boolean(item.children?.length)}
            checked={selected.some(current => isArraysEqual(current, item.path))}
            onChange={e => setSelected(item.path, e.currentTarget.checked)}
          />
          {item.label}
        </label>
      </div>
      {item.children && isOpen && item.children.map(child => <Item key={child.label} item={child}/>)}
    </div>
  );
};

const Dropdown = ({ show, items, dropdownRef }: DropdownProps) => {
  return (
    <div className={styles.taxonomy__dropdown} ref={dropdownRef} style={{ display: show ? "block" : "none" }}>
      {items.map(item => <Item key={item.label} item={item} />)}
    </div>
  );
};

const Taxonomy = ({ items, selected: externalSelected, onChange, options = {} }: TaxonomyProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const onClickOutside = useCallback(e => {
    if (!dropdownRef.current?.contains(e.target)) close();
  }, []);
  const onEsc = useCallback(e => {
    if (e.key === "Escape") {
      close();
      e.stopPropagation();
    }
  }, []);

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

  useEffect(() => {
    setInternalSelected(externalSelected);
  }, [externalSelected]);

  useEffect(() => {
    if (isOpen) {
      document.body.addEventListener("click", onClickOutside, true);
      document.body.addEventListener("keydown", onEsc, true);
    } else {
      document.body.removeEventListener("click", onClickOutside);
      document.body.removeEventListener("keydown", onEsc);
    }
  }, [isOpen]);

  return (
    <TaxonomySelectedContext.Provider value={contextValue}>
      <TaxonomyOptionsContext.Provider value={options}>
        <div className={styles.taxonomy}>
          <SelectedList />
          <span onClick={() => !isOpen && setOpen(true)}>Click to add...</span>
          <Dropdown show={isOpen} items={items} dropdownRef={dropdownRef} />
        </div>
      </TaxonomyOptionsContext.Provider>
    </TaxonomySelectedContext.Provider>
  );
};

export { Taxonomy };
