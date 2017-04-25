// @flow

import type { Converter } from '../flow/Converters';

export default function<U, V> (newFn: Converter<U, V>, rest: Converter<U, V>): Converter<U, V> {
  return (arg: U): V => {
    const newResult: V = newFn(arg);
    if (newResult !== undefined && newResult !== null) {
      return newResult;
    }

    return rest(arg);
  };
}
