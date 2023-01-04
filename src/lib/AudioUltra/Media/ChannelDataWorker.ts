import { average, bufferAllocator } from '../Common/Utils';
import { ComputeWorker } from '../Common/Worker';

const allocator = bufferAllocator();

export const reduceNoise = ({
  sampleRate,
  data,
  denoize,
}: {
  sampleRate: number,
  data: Float32Array[],
  denoize?: boolean,
}) => {
  if (denoize === false) return data;

  const sampleSize = Math.floor(sampleRate * 0.01);

  const chunks = Array.from({ length: data.length });

  for (let i = 0; i < data.length; i++) {
    const chunk = data[i];

    // Get sample size for 0.01 seconds
    const length = chunk.length;
    const result = allocator.allocate(length);

    for (let i = 0; i < length; i += sampleSize) {
      const slice = chunk.slice(i, i + sampleSize);
      const avg = average(slice);

      slice.fill(avg);

      result.set(slice, i);
    }

    chunks[i] = result;
  }

  return chunks;
};

ComputeWorker.Messenger.receive({
  compute: (data, storage, respond) => {
    respond({});
  },

  precompute: (data, storage, respond) => {
    respond({
      data: reduceNoise(data),
    });
  },
});
