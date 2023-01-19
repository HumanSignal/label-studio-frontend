import { AudioDecoder } from './AudioDecoder';

type DecoderCache = Map<string, AudioDecoder>;
type DecoderProxy = ReturnType<typeof decoderProxy>;

function decoderProxy(cache: DecoderCache, src: string) {
  const decoder = cache.get(src) ?? new AudioDecoder(src);

  return new Proxy(decoder, {
    get(target, prop) {
      if (prop in target) {
        const instance = cache.get(src) as AudioDecoder;

        return instance[prop as keyof AudioDecoder];
      }
      return undefined;
    },
  });
}

class AudioDecoderPool {
  static cache: DecoderCache = new Map();

  getDecoder(src: string): DecoderProxy {
    const decoder = decoderProxy(AudioDecoderPool.cache, src);

    return decoder;
  }
}

export const audioDecoderPool = new AudioDecoderPool();

