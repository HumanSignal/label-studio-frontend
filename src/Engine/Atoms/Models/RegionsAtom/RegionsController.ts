import { ResultInput } from '@atoms/Inputs/ResultInput';
import { atom, PrimitiveAtom } from 'jotai';
import { RegionController } from './RegionController';
import { Region } from './Types';

export class RegionsController {
  private controllers = new WeakMap<PrimitiveAtom<Region>, RegionController>();

  regionsAtom: PrimitiveAtom<PrimitiveAtom<Region>[]>;

  constructor(rawResults: ResultInput[]) {
    this.regionsAtom = this.createRegionAtomsFromResults(rawResults);
  }

  getController(regionAtom: PrimitiveAtom<Region>) {
    return this.controllers.get(regionAtom);
  }

  private createRegionAtomsFromResults(rawResults: ResultInput[]) {
    const result = this.splitResults(rawResults);
    const atoms = new Array<PrimitiveAtom<Region>>(result.length);

    for (const resultGroup of result) {
      const {
        to_name,
        id,
      } = resultGroup[0];

      const index = result.indexOf(resultGroup);
      const controller = new RegionController({
        id,
        toName: to_name,
      }, rawResults);

      atoms[index] = controller.regionAtom;

      this.controllers.set(controller.regionAtom, controller);
    }

    return atom(atoms);
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
