import { info } from '../Common/Utils';
import { AudioDecoder } from './AudioDecoder';

export type DecoderCache = Map<string, AudioDecoder>;
export type DecoderProxy = ReturnType<typeof decoderProxy>;

const REMOVAL_GRACE_PERIOD = 1000; // 1s grace period for removal of the decoder from the cache

function decoderProxy(cache: DecoderCache, src: string) {
  const decoder = cache.get(src) ?? new AudioDecoder(src);

  decoder.renew();
  cache.set(src, decoder);

  return new Proxy(decoder, {
    get(target, prop) {
      if (prop in target) {
        // Operate on the instance, and cache it
        const instance = cache.get(src) as AudioDecoder;

        // Cancel the removal of the decoder from the cache
        // It is still in use
        if (instance.removalId) {
          clearTimeout(instance.removalId);
          info('decode:renew', src);
          instance.removalId = null;
          instance.renew();
          cache.set(src, instance);
        }

        const val = instance[prop as keyof AudioDecoder];

        // When the instance is no longer in use, remove it from the cache
        // Allow for a grace period before removal so that the decoded results can be reused
        if (prop === 'destroy' && typeof val === 'function') {
          return (...args: any[]) => {
            instance.removalId = setTimeout(() => {
              info('decodepool:destroy', src);
              cache.delete(src);
            }, REMOVAL_GRACE_PERIOD);
            cache.set(src, instance);
            return (val.bind(instance) as any)(...args);
          };
        }

        return val;
      }
      return undefined;
    },
  });
}

export class AudioDecoderPool {
  static cache: DecoderCache = new Map();

  getDecoder(src: string): DecoderProxy {
    const decoder = decoderProxy(AudioDecoderPool.cache, src);

    return decoder;
  }
}

export const audioDecoderPool = new AudioDecoderPool();

