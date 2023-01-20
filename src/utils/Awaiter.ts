// export class Awaiter<Output> extends Promise<Output> {
//   private promise!: Promise<Output>;
//   private _resolve!: (value: Output | PromiseLike<Output>) => void;
//   private _reject!: (reason?: any) => void;
//   private _value?: Output | PromiseLike<Output>;
//   private fulfilled = false;

//   constructor() {
//     super(() => {});
//     this.reset();
//   }

//   resolve(value: Output | PromiseLike<Output>) {
//     this.fulfilled = true;
//     this._value = value;
//     this._resolve(value);
//   }

//   reject(reason?: any) {
//     this._reject(reason);
//   }

//   reset() {
//     this.promise = new Promise<Output>((resolve, reject) => {
//       this._resolve = resolve;
//       this._reject = reject;
//     });
//   }

//   then<TResult1 = Output, TResult2 = never>(
//     onFulfilled?: ((value: Output) => TResult1 | PromiseLike<TResult1>) | undefined | null,
//     onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
//   ): PromiseLike<TResult1 | TResult2> {
//     return this.fulfilled
//       ? Promise.resolve<TResult1 | TResult2>(this._value as (TResult1 | TResult2))
//       : this.promise.then(onFulfilled, onRejected);
//   }

//   catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<Output | TResult> {
//     return this.promise.catch(onrejected);
//   }

//   finally(onfinally?: (() => void) | null | undefined): Promise<Output> {
//     return this.promise.finally(onfinally);
//   }
// }

const hasKey = <T extends object>(obj: T, k: keyof any): k is keyof T =>
  k in obj;

export const Awaiter = <Output>() => {
  let _resolve: (value: Output | PromiseLike<Output>) => void;
  let _reject: (reason?: any) => void;

  const promise = new Promise<Output>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  return new Proxy(promise, {
    get: (target, prop) => {
      if (prop === 'resolve') {
        return _resolve.bind(target);
      } else if (prop === 'reject') {
        return _reject.bind(target);
      } else if (hasKey(target, prop)) {
        const value = target[prop];

        return value instanceof Function ? value.bind(target) : value;
      }
    },
  }) as Promise<Output> & {
    resolve: (value: Output | PromiseLike<Output>) => void,
    reject: (reason?: any) => void,
  };
};
