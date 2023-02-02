import { ResultInput } from '@atoms/Inputs/ResultInput';
import { atom, PrimitiveAtom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { WithInternalSDK } from 'src/core/SDK/Internal/WithInternalSDK';
import { RegionController } from '../../../Regions/RegionController';
import { Region, RegionOrder } from './Types';

type RegionParams = {
  id: string,
  toName: string,
  result: ResultInput[],
}

export class RegionsController extends WithInternalSDK {
  private controllers = new WeakMap<PrimitiveAtom<Region>, RegionController>();

  atom: PrimitiveAtom<PrimitiveAtom<Region>[]>;
  selectionAtom = atomWithReset<PrimitiveAtom<Region>[]>([]);
  orderingAtom = atom<RegionOrder>({
    selection: new Set<string>(),
    group: 'manual',
    orderBy: 'date',
    order: 'asc',
  });

  constructor(internalSDK: InternalSDK, rawResults: ResultInput[]) {
    super(internalSDK);

    this.atom = this.createRegionAtomsFromResults(rawResults);
  }

  get list() {
    return this.get(this.atom).map((regionAtom) => {
      return this.controllers.get(regionAtom);
    });
  }

  get listAtoms() {
    return this.get(this.atom);
  }

  setOrder = (order: RegionOrder['order']) => {
    this.patch(this.orderingAtom, { order });
  };

  setOrderBy = (orderBy: RegionOrder['orderBy']) => {
    this.patch(this.orderingAtom, { orderBy });
  };

  setGroup = (group: RegionOrder['group']) => {
    this.patch(this.orderingAtom, { group });
  };

  getController(regionAtom: PrimitiveAtom<Region>) {
    return this.controllers.get(regionAtom);
  }

  export() {
    const result: ResultInput[] = [];

    return this
      .get(this.atom)
      .reduce((res, regionAtom) => {
        const controller = this.getController(regionAtom);

        return controller ? [...res, ...controller.export()] : res;
      }, result);
  }

  add(rawResults: ResultInput[]) {
    const newRegions = this.createRegionsFromResults(rawResults);

    this.set(this.atom, (currentResult) => {
      return [...currentResult, ...newRegions];
    });

    return this.get(this.atom).at(-1)!;
  }

  createRegion({ result, ...regionBase }: RegionParams) {
    return new RegionController(this.sdk, regionBase, result);
  }

  /**
   * Removes region and its controller
   * @param regionAtom region to be removed
   * @returns true if region was removed, false otherwise
   */
  remove(regionAtom: PrimitiveAtom<Region>) {
    if (!this.getController(regionAtom)) return;

    this.set(this.atom, (currentResult) => {
      return currentResult.filter((atom) => atom !== regionAtom);
    });

    return this.controllers.delete(regionAtom);
  }

  /**
   * Removes all regions and their controllers
   */
  destroy() {
    this.get(this.atom).forEach((regionAtom) => {
      const controller = this.controllers.get(regionAtom);

      if (!controller) return;

      controller.destroy();

      this.controllers.delete(regionAtom);
    });

    this.set(this.selectionAtom, RESET);
  }

  /**
   * Creates regions list from Result respecting the duplicated IDs
   * @param rawResults list of results to be converted to regions
   * @returns List of region atoms
   */
  private createRegionsFromResults(rawResults: ResultInput[]) {
    const result = this.splitResults(rawResults);
    const atoms = new Array<PrimitiveAtom<Region>>(result.length);

    for (const resultGroup of result) {
      const {
        to_name,
        id,
      } = resultGroup[0];

      const index = result.indexOf(resultGroup);
      const controller = this.createRegion({
        id,
        toName: to_name,
        result: resultGroup,
      });

      atoms[index] = controller.regionAtom;

      this.controllers.set(controller.regionAtom, controller);
    }

    return atoms;
  }

  /**
   * Creates an atom with a list of region atoms from a list of results
   * @param rawResults list of results to be converted to regions
   * @returns Atom with a list of region atoms
   */
  private createRegionAtomsFromResults(rawResults: ResultInput[]) {
    return atom(this.createRegionsFromResults(rawResults));
  }

  /**
   * Function that splits a list of results by their ids
   * @param results list of results to be split
   * @returns list of list of results, each list containing all results with the same id
   */
  private splitResults(results: ResultInput[]) {
    const result = new Map<string, ResultInput[]>();

    for (const r of results) {
      const list = result.get(r.id) || [];

      list.push(r);
      result.set(r.id, list);
    }

    return Array.from(result.values());
  }
}
