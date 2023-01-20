import { Atom, atom, Getter, PrimitiveAtom, Setter, WritableAtom } from 'jotai';
import { useRef } from 'react';

type WithInitialValue<Value> = {
  init: Value,
};

type Read<Value> = (get: Getter) => Value;
type Write<Update, Result extends void | Promise<void>> = (get: WriteGetter, set: Setter, update: Update) => Result;
type WriteGetter = Getter & {
  <Value>(atom: Atom<Value | Promise<Value>>, options: {
    unstable_promise: true,
  }): Promise<Value> | Value,
  <Value>(atom: Atom<Promise<Value>>, options: {
    unstable_promise: true,
  }): Promise<Value> | Value,
  <Value>(atom: Atom<Value>, options: {
    unstable_promise: true,
  }): Promise<Awaited<Value>> | Awaited<Value>,
};

export function useCreateAtom<Value, Update, Result extends void | Promise<void> = void>(read: Read<Value>, write: Write<Update, Result>): WritableAtom<Value, Update, Result>;
export function useCreateAtom<Value>(read: Read<Value>): Atom<Value>;
export function useCreateAtom(invalidFunction: (...args: any) => any, write?: any): never;
export function useCreateAtom<Value, Update, Result extends void | Promise<void> = void>(initialValue: Value, write: Write<Update, Result>): WritableAtom<Value, Update, Result> & WithInitialValue<Value>;
export function useCreateAtom<Value>(initialValue: Value): PrimitiveAtom<Value> & WithInitialValue<Value>;

export function useCreateAtom(read: any, write?: any) {
  const localAtom = atom(read, write);
  const atomRef = useRef(localAtom);

  return atomRef.current;
}

type AnyFunction = (...args: any[]) => any

export function useCreateCustomAtom<
  T extends AnyFunction,
>(atomCreator: T, ...args: Parameters<T>): ReturnType<T> {
  const localAtom = atomCreator(...args);
  const atomRef = useRef<ReturnType<T>>(localAtom);

  return atomRef.current;
}
