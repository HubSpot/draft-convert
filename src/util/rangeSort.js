// @flow

import type { Mutation } from '../flow/Mutations';

export default (r1: Mutation, r2: Mutation): number => {
  if (r1.offset === r2.offset) {
    return r2.length - r1.length;
  }
  return r1.offset - r2.offset;
};
