import React, { useState, useCallback, useEffect, useRef } from "react";

import styles from "./Taxonomy.module.scss";
import { useToggle } from "../../hooks/useToggle";

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

const SelectedList = ({ selected }: { selected: TaxonomyPath[] }) => (
  <div className={styles.taxonomy__selected}>
    {selected.map(path => <div key={path.join("|")}>{path[path.length - 1]}</div>)}
  </div>
);

const Item = ({ item }: { item: TaxonomyItem }) => {
  const [isOpen, , , toggle] = useToggle();
  const prefix = item.children?.length ? (isOpen ? "-" : "+") : " ";

  return (
    <div>
      <div className={styles.taxonomy__item}>
        <div className={styles.taxonomy__grouping} onClick={toggle}>{prefix}</div>
        <label>
          <input type="checkbox"/>
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

const Taxonomy = ({ items, selected }: TaxonomyProps) => {
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
    <div className={styles.taxonomy}>
      <SelectedList selected={selected} />
      <span onClick={() => !isOpen && setOpen(true)}>Click to add...</span>
      <Dropdown show={isOpen} items={items} dropdownRef={dropdownRef} />
    </div>
  );
};

export { Taxonomy };
