import { Store } from '@atoms/Store';
import { InternalSDK } from './Internal.sdk';

const SDK_KEY = Symbol('INTERNAL_SDK');

export class WithInternalSDK extends Store {
  private [SDK_KEY]: InternalSDK;

  constructor(sdk: InternalSDK) {
    super();

    this[SDK_KEY] = sdk;
  }

  get sdk() {
    return this[SDK_KEY];
  }
}
