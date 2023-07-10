import { observer } from 'mobx-react';
import { isAlive } from 'mobx-state-tree';

import { IReactComponent } from 'mobx-react/dist/types/IReactComponent';
import { useCallback } from 'react';

type Region = {
  annotation: any,
  hidden: boolean,
  // ...
  setShapeRef(ref: any): void,
}

type RegionComponentProps = {
  item: Region,
  setShapeRef: (ref: any) => void,
}

type Options = {
  renderHidden?: boolean,
}

export const AliveRegion = (
  RegionComponent: IReactComponent<RegionComponentProps>,
  options?: Options,
) => {
  const ObservableRegion = observer(RegionComponent);

  return observer(({ item, ...rest }: RegionComponentProps) => {
    const canRender = options?.renderHidden || !item.hidden;
    const isInTree = !!item.annotation;
    const setShapeRef = useCallback((ref) => {
      if (isAlive(item)) {
        item.setShapeRef(ref);
      }
    }, [item]);

    return isInTree && isAlive(item) && canRender ? <ObservableRegion item={item} {...rest} setShapeRef={setShapeRef} /> : null;
  });
};
