import { MutableRefObject, useEffect } from "react";

interface Handlers<T extends HTMLElement = HTMLElement, D = any> {
  elementRef: MutableRefObject<T | undefined>;
  onMouseDown?: (e: MouseEvent) => D;
  onMouseMove?: (e: MouseEvent, data?: D) => void;
  onMouseUp?: (e: MouseEvent, data?: D) => void;
}

export const useDrag = <EL extends HTMLElement = HTMLElement, D = any>(options: Handlers<EL, D>, deps: any[] = []) => {
  useEffect(() => {
    const element = options.elementRef.current;

    const onMouseDown = (e: MouseEvent) => {
      const result = options.onMouseDown?.(e);

      const onMouseMove = (e: MouseEvent) => {
        options.onMouseMove?.(e, result);
      };

      const onMouseUp = (e: MouseEvent) => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        options.onMouseUp?.(e, result);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    element?.addEventListener("mousedown", onMouseDown);

    return () => element?.removeEventListener("mousedown", onMouseDown);
  }, deps);
};
