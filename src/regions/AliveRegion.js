import { observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";

export const AliveRegion = (RegionComponent) => {
  const ObservableRegion = observer(RegionComponent);
  return observer(({item, ...rest}) => {
    return isAlive(item) && !item.hidden ? <ObservableRegion item={item} {...rest} /> : null;
  });
};
