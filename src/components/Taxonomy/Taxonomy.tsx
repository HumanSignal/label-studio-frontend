import React, { useState, useCallback, useEffect, useRef, useMemo, useContext } from "react";

import { useToggle } from "../../hooks/useToggle";
import { isArraysEqual } from "../../utils/utilities";

import styles from "./Taxonomy.module.scss";

type TaxonomyPath = string[]

type TaxonomyItem = {
  label: string,
  path: TaxonomyPath,
  children?: TaxonomyItem[],
}

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: TaxonomyPath[],
  onChange: (node: any, selected: TaxonomyPath[]) => any,
}

type DropdownProps = {
  show: boolean,
  items: TaxonomyItem[],
  dropdownRef: React.Ref<HTMLDivElement>,
}

type TaxonomySelectedContextValue = [
  TaxonomyPath[],
  (path: TaxonomyPath, value: boolean) => any,
]

const TaxonomySelectedContext = React.createContext<TaxonomySelectedContextValue>([[], () => undefined]);

const SelectedList = () => {
  const [selected, setSelected] = useContext(TaxonomySelectedContext);

  return (
    <div className={styles.taxonomy__selected}>
      {selected.map(path => (
        <div key={path.join("|")}>
          {path[path.length - 1]}
          <input type="button" onClick={() => setSelected(path, false)} value="×" />
        </div>
      ))}
    </div>
  );
};

const Item = ({ item }: { item: TaxonomyItem }) => {
  const [selected, setSelected] = useContext(TaxonomySelectedContext);
  const [isOpen, , , toggle] = useToggle();
  const prefix = item.children?.length ? (isOpen ? "-" : "+") : " ";

  return (
    <div>
      <div className={styles.taxonomy__item}>
        <div className={styles.taxonomy__grouping} onClick={toggle}>{prefix}</div>
        <label>
          <input
            type="checkbox"
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

const Taxonomy = ({ items, selected: externalSelected, onChange }: TaxonomyProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const onClickOutside = useCallback(e => {
    if (!dropdownRef.current?.contains(e.target)) close();
  }, []);
  const onEsc = useCallback(e => {
    console.log(e, e.target, e.key);
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
      <div className={styles.taxonomy}>
        <SelectedList />
        <span onClick={() => !isOpen && setOpen(true)}>Click to add...</span>
        <Dropdown show={isOpen} items={items} dropdownRef={dropdownRef} />
      </div>
    </TaxonomySelectedContext.Provider>
  );
};

export { Taxonomy };
