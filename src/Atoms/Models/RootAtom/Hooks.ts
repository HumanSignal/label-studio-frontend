import { useAtom, useAtomValue } from 'jotai';
import { autoAnnotationAtom, forceAutoAcceptSuggestionsAtom, forceAutoAnnotationAtom, InstructionsAtom, InstructionsVisibilityAtom, InterfacesAtom } from './RootAtom';

export const useAutoAnnotation = () => {
  const forceAutoAnnotation = useAtomValue(forceAutoAnnotationAtom);
  const [autoAnnotation, setAutoAnnotation] = useAtom(autoAnnotationAtom);

  return [forceAutoAnnotation || autoAnnotation, setAutoAnnotation];
};

export const useAutoAcceptSuggestions = () => {
  const forceAutoAcceptSuggestions = useAtomValue(forceAutoAcceptSuggestionsAtom);
  const [autoAcceptSuggestions, setAutoAcceptSuggestions] = useAtom(autoAnnotationAtom);

  return [forceAutoAcceptSuggestions || autoAcceptSuggestions, setAutoAcceptSuggestions];
};

export const useInterfaces = () => {
  const interfaces = useAtomValue(InterfacesAtom);

  return (interfaceName: string) => interfaces.includes(interfaceName);
};

export const useInstructions = (): [
  string | undefined,
  boolean,
  ((update: boolean) => void)
] => {
  const instructions = useAtomValue(InstructionsAtom);
  const [showingInstructions, setShowingInstructions] = useAtom(InstructionsVisibilityAtom);

  return [
    instructions,
    showingInstructions ?? false,
    setShowingInstructions,
  ];
};
