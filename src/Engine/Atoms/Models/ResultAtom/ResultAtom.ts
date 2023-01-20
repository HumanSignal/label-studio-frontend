import { atom, PrimitiveAtom, WritableAtom } from 'jotai';
import { AnnotationAtom } from '../AnnotationsAtom/Types';
import { Result, Results } from './Types';

type ResultAccessor = WritableAtom<PrimitiveAtom<Result>[], Result>

const ResultAtoms = new WeakMap<AnnotationAtom, ResultAccessor>();

export const createResultInitialValue = (result?: Results | Result[]): Results => {
  const [
    inputResults,
    initialValue,
  ] = Array.isArray(result) ? [result, {}] : [(result?.result ?? []), result];

  return {
    ...initialValue,
    result: inputResults,
    selection: new Set<string>(),
    group: 'manual',
    orderBy: 'date',
    order: 'asc',
  };
};

export const createResultsAtom = (
  annotationAtom: AnnotationAtom,
  result: Result[],
) => {
  if (ResultAtoms.has(annotationAtom)) {
    return ResultAtoms.get(annotationAtom);
  }

  const initialValue = result.map(r => atom<Result>(r));
  const regionsAtom = atom(initialValue);
  const regionsListAtom = atom<PrimitiveAtom<Result>[], Result>((get) => {
    return get(regionsAtom);
  }, (get, set, update) => {
    const list = get(regionsAtom);

    set(regionsAtom, [...list, atom(update)]);
  });

  // const resultRootAtom = focusAtom(annotationAtom, (optic) => optic.prop('result'));
  // const resultsAtom = focusAtom(resultRootAtom, (optic) => optic.prop('result'));
  // const resultListAtom = splitAtom(resultsAtom);

  // const accessor = {
  //   resultAtom: resultRootAtom,
  //   resultListAtom,
  // } satisfies ResultAccessor;

  ResultAtoms.set(annotationAtom, regionsListAtom);

  return regionsListAtom;
};
