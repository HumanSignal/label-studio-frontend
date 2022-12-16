import { PrimitiveAtom, useAtom } from 'jotai';
import { useCallback } from 'react';
import { Regions } from './Types';

export const useRegionsOrder = (regions: PrimitiveAtom<Regions>) => {
  const [regionsStore, setRegionStore] = useAtom(regions);

  const setOrder = useCallback((order: Regions['order']) => {
    setRegionStore((prev) => ({ ...prev, order }));
  }, []);

  const setOrderBy = useCallback((orderBy: Regions['orderBy']) => {
    setRegionStore((prev) => ({ ...prev, orderBy }));
  }, []);

  const setGroup = useCallback((group: Regions['group']) => {
    setRegionStore((prev) => ({ ...prev, group }));
  }, []);

  return {
    order: regionsStore.order,
    orderBy: regionsStore.orderBy,
    group: regionsStore.group,
    setGroup,
    setOrderBy,
    setOrder,
  };
};
