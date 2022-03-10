import { cloneElement, CSSProperties, forwardRef, MouseEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Block, cn } from "../../utils/bem";
import { alignElements } from "../../utils/dom";
import { aroundTransition } from "../../utils/transition";
import "./Dropdown.styl";
import { DropdownContext } from "./DropdownContext";

let lastIndex = 1;

export interface DropdownRef {
  dropdown: HTMLElement;
  visible: boolean;
  toggle(): void;
  open(): void;
  close(): void;
}

export interface DropdownProps {
  animated?: boolean;
  visible?: boolean;
  enabled?: boolean;
  inline?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: JSX.Element;
  onToggle?: (visible: boolean) => void;
}

export const Dropdown = forwardRef<DropdownRef, DropdownProps>(({
  animated = true,
  visible = false,
  ...props
}, ref) => {
  const rootName = cn("dropdown");

  /**@type {import('react').RefObject<HTMLElement>} */
  const dropdown = useRef<HTMLElement>();
  const { triggerRef } = useContext(DropdownContext) ?? {};
  const isInline = triggerRef === undefined;

  const { children } = props;
  const [currentVisible, setVisible] = useState(visible);
  const [offset, setOffset] = useState({});
  const [visibility, setVisibility] = useState(
    visible ? "visible" : null,
  );

  const calculatePosition = useCallback(() => {
    const dropdownEl = dropdown.current!;
    const parent = (triggerRef?.current ?? dropdownEl.parentNode) as HTMLElement;
    const { left, top } = alignElements(parent!, dropdownEl, "bottom-left");

    setOffset({ left, top });
  }, [triggerRef]);

  const dropdownIndex = useMemo(() => {
    return lastIndex++;
  }, []);

  const performAnimation = useCallback(
    async (visible = false) => {
      if (props.enabled === false && visible === true) return;

      return new Promise<void>((resolve) => {
        const menu = dropdown.current!;

        if (animated !== false) {
          aroundTransition(menu, {
            transition: () => {
              setVisibility(visible ? "appear" : "disappear");
            },
            beforeTransition: () => {
              setVisibility(visible ? "before-appear" : "before-disappear");
            },
            afterTransition: () => {
              setVisibility(visible ? "visible" : null);
              resolve();
            },
          });
        } else {
          setVisibility(visible ? "visible" : null);
          resolve();
        }
      });
    },
    [animated],
  );

  const close = useCallback(async () => {
    if (currentVisible === false) return;

    props.onToggle?.(false);
    await performAnimation(false);
    setVisible(false);
  }, [currentVisible, performAnimation, props]);

  const open = useCallback(async () => {
    if (currentVisible === true) return;

    props.onToggle?.(true);
    await performAnimation(true);
    setVisible(true);
  }, [currentVisible, performAnimation, props]);

  const toggle = useCallback(async () => {
    const newState = !currentVisible;

    if (newState) {
      open();
    } else {
      close();
    }
  }, [close, currentVisible, open]);

  useEffect(() => {
    if (!ref) return;

    const refValue: DropdownRef = {
      dropdown: dropdown.current!,
      visible: visibility !== null,
      toggle,
      open,
      close,
    };

    if (ref instanceof Function) {
      ref(refValue);
    } else {
      ref.current = refValue;
    }
  }, [close, open, ref, toggle, dropdown, visibility]);

  useEffect(() => {
    setVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!isInline && visibility === "before-appear") {
      calculatePosition();
    }
  }, [visibility, calculatePosition, isInline]);

  useEffect(() => {
    if (props.enabled === false) performAnimation(false);
  }, [props.enabled]);

  useEffect(() => {
    if (visible) {
      open();
    } else {
      close();
    }
  }, [visible]);

  const content = useMemo(() => {
    const ch = children as any;

    return ch.props && ch.props.type === "Menu"
      ? cloneElement(ch, {
        ...ch.props,
        className: rootName.elem("menu").mix(ch.props.className),
      })
      : children;
  }, [children]);


  const visibilityClasses = useMemo(() => {
    switch (visibility) {
      case "before-appear":
        return "before-appear";
      case "appear":
        return "appear before-appear";
      case "before-disappear":
        return "before-disappear";
      case "disappear":
        return "disappear before-disappear";
      case "visible":
        return "visible";
      default:
        return visible ? "visible" : null;
    }
  }, [visibility, visible]);

  const compositeStyles = {
    ...(props.style ?? {}),
    ...(offset ?? {}),
    zIndex: 1000 + dropdownIndex,
  };

  const result = (
    <Block
      ref={dropdown}
      name="dropdown"
      mix={[props.className, visibilityClasses]}
      style={compositeStyles}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      {content}
    </Block>
  );

  return props.inline === true
    ? result
    : createPortal(result, document.body);
});

Dropdown.displayName = "Dropdown";
