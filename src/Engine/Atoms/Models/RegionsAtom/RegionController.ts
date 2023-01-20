import { ResultInput } from '@atoms/Inputs/ResultInput';
import { atom, PrimitiveAtom } from 'jotai';
import { guidGenerator } from 'src/utils/unique';
import { Region, Result } from './Types';

type RegionBase = {
  id?: string,
  toName: string,
}

export class RegionController {
  regionAtom: PrimitiveAtom<Region>;
  valuesAtomsAtom: PrimitiveAtom<PrimitiveAtom<Result>[]>;

  constructor(regionBase: RegionBase, rawResults: ResultInput[]) {
    this.regionAtom = this.createRegionAtom(regionBase);
    this.valuesAtomsAtom = this.createResultAtomsAtom(rawResults);
  }

  /**
   * Creates region atom.
   * @param regionBase - Options.
   * @param rawResults - Array of results.
   * @returns Region atom.
   */
  private createRegionAtom(regionBase: RegionBase) {
    const { id = guidGenerator(), toName } = regionBase;
    const regionAtom = atom<Region>({ id, toName });

    return regionAtom;
  }

  private createResultAtomsAtom(rawResults: ResultInput[]) {
    const resultAtoms = new Array<PrimitiveAtom<Result>>(rawResults.length);

    for (let i = 0; i < rawResults.length; i++) {
      const result = rawResults[i];

      const resultAtom = atom<Result>({
        fromName: result.from_name,
        value: result.value,
        score: result.score,
        origin: result.origin,
      });

      resultAtoms[i] = resultAtom;
    }

    return atom<PrimitiveAtom<Result>[]>(resultAtoms);
  }
}
