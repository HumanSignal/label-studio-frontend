import { useAtomValue } from 'jotai';
import { InterfacesAtom } from './RootAtom';

export const useInterfaces = () => {
  const interfaces = useAtomValue(InterfacesAtom);

  return (interfaceName: string) => interfaces.includes(interfaceName);
};
