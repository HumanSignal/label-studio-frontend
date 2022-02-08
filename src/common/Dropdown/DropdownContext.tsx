import React, { RefObject } from "react";
import { DropdownRef } from "./DropdownComponent";

export interface DropdownContextValue {
  triggerRef: RefObject<HTMLElement>;
  dropdown: RefObject<DropdownRef>;
  hasTarget(target: HTMLElement): boolean;
  addChild(child: DropdownContextValue): void;
  removeChild(child: DropdownContextValue): void;
  open(): void;
  close(): void;
}

export const DropdownContext = React.createContext<DropdownContextValue | null>(null);
