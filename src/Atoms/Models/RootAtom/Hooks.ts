import { useAtom, useAtomValue } from 'jotai';
import { InstructionsAtom, InstructionsVisibilityAtom, InterfacesAtom } from './RootAtom';

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
