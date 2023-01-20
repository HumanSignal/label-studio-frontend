import { FC } from 'react';

export interface Settings<T = {}> extends FC<{store: any} & T> {
  tagName: string;
  title: string;
}
