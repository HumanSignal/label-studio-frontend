import { TagController } from '@tags/Base/TagController';
import { useEffect } from 'react';
import { RegisteredController } from './CommunicationBus';

export const useControllerEvent = <
  Controller extends TagController,
  DataType extends Record<string, any>,
>(
  controller: Controller,
  eventName: string,
  callback: (tag: RegisteredController, data: DataType) => void,
  deps: any[] = [],
) => {
  useEffect(() => {
    const listener = callback;

    controller.subscribe(eventName, listener);

    return () => controller.unsubscribe(eventName, listener);
  }, [controller, eventName, callback, ...deps]);
};
