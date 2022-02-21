import { useEffect, useRef } from "react";

export const useMemoizedHandlers = <T extends Record<string, any>>(handlers: T): T => {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    console.log("handlers updated");
    Object.assign(handlersRef.current, handlers);
  }, [handlers]);

  return handlersRef.current;
};
