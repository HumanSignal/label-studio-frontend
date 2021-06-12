import { observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";

export const AliveRegion = (RegionComponent) => observer(({item, ...rest}) => {
  return isAlive(item) && !item.hidden ? <RegionComponent item={item} {...rest} /> : null;
});
