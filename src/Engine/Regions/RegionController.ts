import { ResultInput } from '@atoms/Inputs/ResultInput';
import { atom, PrimitiveAtom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { defaultStyle } from 'src/core/Constants';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { WithInternalSDK } from 'src/core/SDK/Internal/WithInternalSDK';
import { guidGenerator } from 'src/utils/unique';
import { Region, Result } from '../Atoms/Models/RegionsAtom/Types';
import * as RegionValue from './AllValues';
import { ResultValueType } from './RegionValue';

type RegionBase = {
  id?: string,
  toName: string,
}

type ResultWithController = Omit<Result, 'value'> & {
  value: RegionValue.RegionValueType,
}

type ResultItemAtom = PrimitiveAtom<ResultWithController>;

export class RegionController extends WithInternalSDK {
  // Internal state
  #parentID = atom<string | null>(null);
  #hidden = atom(false);
  #isDrawing = atom(false);

  regionAtom: PrimitiveAtom<Region>;
  valuesAtomsAtom: PrimitiveAtom<ResultItemAtom[]>;

  get type() {
    const values = this.get(this.valuesAtomsAtom);
    const value = this.get(values[0]);

    return value.type;
  }

  get parentID() {
    return this.get(this.#parentID);
  }

  set parentID(id: string | null) {
    this.set(this.#parentID, id);
  }

  get hidden() {
    return this.get(this.#hidden);
  }

  set hidden(value: boolean) {
    this.set(this.#hidden, value);
  }

  get isDrawing() {
    return this.get(this.#isDrawing);
  }

  set isDrawing(value: boolean) {
    this.set(this.#isDrawing, value);
  }

  get objects() {
    return this.get(this.valuesAtomsAtom).map(resultAtom => {
      const name = this.get(resultAtom).fromName;
      const configNode = this.sdk.tree.findNodeByName(name);

      return this.sdk.tree.findActiveController(configNode!);
    });
  }

  get control() {
    const toName = this.get(this.regionAtom).toName;

    const configNode = this.sdk.tree.findNodeByName(toName);

    return this.sdk.tree.findActiveController(configNode!);
  }

  get region() {
    return this.get(this.regionAtom);
  }

  get values() {
    return this.get(this.valuesAtomsAtom).map((resultAtom) => {
      return this.get(resultAtom);
    });
  }

  get results() {
    return this.get(this.valuesAtomsAtom).map((resultAtom) => {
      return this.get(resultAtom);
    });
  }

  get style() {
    const type = this.type;

    return this.results.find(r => r.value.style
      || type.startsWith(r.type),
    )?.value.style ?? null;
  }

  get labeling() {
    return this.values.find(v => v.type.includes('labels'))?.value;
  }

  get selectedLabels() {
    const labeling = this.values.filter((v) => {
      return v.type.includes('labels');
    }).map((v) => {
      return v.value.properties[v.type];
    });

    return labeling.flat();
  }

  get singleResult() {
    return this.results.find(r => r.value)?.value;
  }

  get oneColor() {
    return this.style?.fillColor ?? defaultStyle.fillcolor;
  }

  constructor(
    internalSDK: InternalSDK,
    regionBase: RegionBase,
    rawResults: ResultInput[],
  ) {
    super(internalSDK);

    this.regionAtom = this.createRegionAtom(regionBase);
    this.valuesAtomsAtom = this.createValueAtoms(rawResults);
  }

  export() {
    const region = this.get(this.regionAtom);

    return this.get(this.valuesAtomsAtom).map((resultAtom) => {
      const result = this.get(resultAtom);

      return {
        ...region,
        ...result,
        id: region.id,
        to_name: region.toName,
        from_name: result.fromName,
        type: result.type,
        value: result.value.export(),
      } as ResultInput;
    });
  }

  destroy() {
    this.set(this.valuesAtomsAtom, []);
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

  private createValueAtoms(rawResults: ResultInput[]) {
    const resultAtoms = new Array<ResultItemAtom>(rawResults.length);

    for (let i = 0; i < rawResults.length; i++) {
      const result = rawResults[i];
      const ResultValue = this.findRegionValue(result.type);
      const value = new ResultValue(
        result.from_name,
        result.value as any,
        this.sdk.tree,
      );

      const initialValue: ResultWithController = {
        fromName: result.from_name,
        score: result.score,
        origin: result.origin,
        type: result.type,
        value,
      };

      resultAtoms[i] = atom(initialValue);
    }

    return atomWithReset<ResultItemAtom[]>(resultAtoms);
  }

  private findRegionValue(type: ResultValueType) {
    const resultValueClass = Object.values(RegionValue).find((value) => value.type === type);

    if (!resultValueClass) throw new Error(`Region value type ${type} not found.`);

    return resultValueClass;
  }
}
