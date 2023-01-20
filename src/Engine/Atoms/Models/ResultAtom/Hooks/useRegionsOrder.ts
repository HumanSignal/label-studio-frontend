import { PrimitiveAtom, useAtom } from 'jotai';
import { useCallback } from 'react';
import { Results } from '../Types';

export const useRegionsOrder = (regions: PrimitiveAtom<Results>) => {
  const [regionsStore, setRegionStore] = useAtom(regions);

  const setOrder = useCallback((order: Results['order']) => {
    setRegionStore((prev) => ({ ...prev, order }));
  }, []);

  const setOrderBy = useCallback((orderBy: Results['orderBy']) => {
    setRegionStore((prev) => ({ ...prev, orderBy }));
  }, []);

  const setGroup = useCallback((group: Results['group']) => {
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
