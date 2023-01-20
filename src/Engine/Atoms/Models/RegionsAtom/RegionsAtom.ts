import { ResultInput } from '@atoms/Inputs/ResultInput';
import { PrimitiveAtom } from 'jotai';
import { guidGenerator } from 'src/utils/unique';
import { RegionController } from './RegionController';
import { Region } from './Types';

/**
 * Creates region atom.
 * @param regionBase - Options.
 * @param rawResults - Array of results.
 * @returns Region atom.
 */
const createRegionAtom = (regionBase: {
  id?: string,
  toName: string,
}, rawResults: ResultInput[]) => {

  const { id, toName } = regionBase;

  const initialValue: Region = {
    id: id || guidGenerator(),
    toName,
  };

  const controller = new RegionController(initialValue, rawResults);

  return {
    regionAtom: controller.regionAtom,
    values: controller.valuesAtomsAtom,
  };
};

export const createRegionAtomsFromResults = (rawResults: ResultInput[]) => {
  const result = splitResults(rawResults);
  const atoms = new Array<PrimitiveAtom<Region>>(result.length);

  for (const resultGroup of result) {
    const {
      to_name,
      id,
    } = resultGroup[0];

    const index = result.indexOf(resultGroup);

    const resultAtom = createRegionAtom({
      id,
      toName: to_name,
    }, resultGroup);

    atoms[index] = resultAtom.regionAtom;
  }

  return atoms;
};

/**
 * Function that splits a list of results by their ids
 * @param results list of results to be split
 * @returns list of list of results, each list containing all results with the same id
 */
const splitResults = (results: ResultInput[]) => {
  const result = new Map<string, ResultInput[]>();

  for (const r of results) {
    const list = result.get(r.id) || [];

    list.push(r);
    result.set(r.id, list);
  }

  return Array.from(result.values());
};
