import { useMemo } from 'react';

type PromiseResult<P> = P extends Promise<infer V>
  ? V
  : P extends PromiseLike<infer V>
    ? V
    : never;

type PromiseFunction = Promise<any> | PromiseLike<any>;

const wrapPromise = <
  T extends PromiseFunction,
  Result extends PromiseResult<T>
>(promise: T) => {
  let status: 'success' | 'error' | 'pending' = 'pending';
  let result: Result;

  const suspend = promise.then(
    (res) => {
      status = 'success';
      result = res;
    },
    (err) => {
      status = 'error';
      result = err;
    },
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspend;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
};

export const useAsyncResource = function<
  T extends {
    [key: string]: PromiseFunction,
  },
  R extends {
    [key in Extract<keyof T, string>]: ReturnType<typeof wrapPromise>;
  }
>(structure: T) {
  const result = useMemo(() => {
    const result = {} as R;

    if (!result.current) {

      for (const key in structure) {
        const promise = structure[key];

        result[key] = wrapPromise(promise) as R[Extract<keyof T, string>];
      }
    }

    return result;
  }, []);

  return result;
};
