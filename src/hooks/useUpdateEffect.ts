import { DependencyList, EffectCallback, useEffect, useRef } from "react";

function useUpdateEffect(effect: EffectCallback, deps?: DependencyList) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (!isFirst.current) effect();
    else isFirst.current = false;
  }, deps);
}

export default useUpdateEffect;
