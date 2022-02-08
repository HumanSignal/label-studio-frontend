import { Children, cloneElement, forwardRef, RefObject, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { cn } from "../../utils/bem";
import { Dropdown, DropdownProps, DropdownRef } from "./DropdownComponent";
import { DropdownContext, DropdownContextValue } from "./DropdownContext";

interface DropdownTriggerProps extends DropdownProps {
  tag?: string;
  dropdown?: RefObject<JSX.Element>;
  content?: JSX.Element;
  toggle?: boolean;
  closeOnClickOutside?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownTrigger = forwardRef<DropdownRef, DropdownTriggerProps>(({
  tag,
  children,
  content,
  toggle,
  closeOnClickOutside = true,
  disabled = false,
  ...props
}, ref ) => {
  const dropdownRef = (ref ?? useRef<DropdownRef>()) as RefObject<DropdownRef>;
  const triggerEL = Children.only(children);
  const childset = useRef(new Set<DropdownContextValue>());

  const triggerRef = (triggerEL as any).props.ref ?? useRef<HTMLElement>();
  const parentDropdown = useContext(DropdownContext);

  const targetIsInsideDropdown = useCallback((target: HTMLElement) => {
    const triggerClicked = triggerRef.current?.contains?.(target);
    const dropdownClicked = dropdownRef.current?.dropdown?.contains?.(
      target,
    );

    const childDropdownClicked = Array
      .from(childset.current)
      .reduce((res, child) => {
        return res || child.hasTarget(target);
      }, false);

    return triggerClicked || dropdownClicked || childDropdownClicked;
  }, [triggerRef, dropdownRef]);

  const handleClick = useCallback(
    (e) => {
      if (!closeOnClickOutside) return;
      if (targetIsInsideDropdown(e.target)) return;

      dropdownRef.current?.close?.();
    },
    [closeOnClickOutside, targetIsInsideDropdown],
  );

  const handleToggle = useCallback(
    (e) => {
      if (disabled) return;

      const inDropdown = dropdownRef.current?.dropdown?.contains?.(e.target);

      if (inDropdown) return e.stopPropagation();

      if (toggle === false) return dropdownRef?.current?.open();

      dropdownRef?.current?.toggle();
    },
    [dropdownRef, disabled],
  );

  const cloneProps = {
    ...(triggerEL as any).props,
    tag,
    key: "dd-trigger",
    ref: triggerRef,
    className: cn("dropdown").elem("trigger").mix(props.className),
    onClickCapture: handleToggle,
  };

  const triggerClone = cloneElement(triggerEL as any, cloneProps);

  const dropdownClone = content ? (
    <Dropdown {...props} ref={dropdownRef}>
      {content}
    </Dropdown>
  ) : null;

  useEffect(() => {
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  const contextValue = useMemo((): DropdownContextValue => ({
    triggerRef,
    dropdown: dropdownRef,
    hasTarget: targetIsInsideDropdown,
    addChild: (child) => childset.current.add(child),
    removeChild: (child) => childset.current.delete(child),
    open: () => dropdownRef?.current?.open?.(),
    close: () => dropdownRef?.current?.close?.(),
  }), [triggerRef, dropdownRef]);

  useEffect(() => {
    if (!parentDropdown) return;

    parentDropdown.addChild(contextValue);
    return () => parentDropdown.removeChild(contextValue);
  }, []);

  return (
    <DropdownContext.Provider value={contextValue}>
      {triggerClone}
      {dropdownClone}
    </DropdownContext.Provider>
  );
});

export const useDropdown = () => {
  return useContext(DropdownContext);
};
