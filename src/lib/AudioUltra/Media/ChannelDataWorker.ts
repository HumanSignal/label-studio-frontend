import { average, bufferAllocator } from "../Common/Utils";
import { ComputeWorker } from "../Common/Worker";

const allocator = bufferAllocator();

export const reduceNoise = ({
  sampleRate,
  data,
  denoize,
}: {
  sampleRate: number,
  data: Float32Array,
  denoize?: boolean,
}) => {
  if (denoize === false) return data;

  // Get sample size for 0.01 seconds
  const length = data.length;
  const result = allocator.allocate(length);
  const sampleSize = Math.ceil(sampleRate / 1000 * (0.001 * 1000));

  for (let i = 0; i < length; i += sampleSize) {
    const slice = data.slice(i, i + sampleSize);
    const avg = average(slice);

    slice.fill(avg);

    result.set(slice, i);
  }

  return result;
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
