// @flow

import type { Mutation } from '../flow/Mutations';

export default function updateMutation<T: Mutation>(
  mutation: T,
  originalOffset: number,
  originalLength: number,
  newLength: number,
  prefixLength: number,
  suffixLength: number
): T | Array<T> {
  // three cases we can reasonably adjust - disjoint mutations that
  // happen later on where the offset will need to be changed,
  // mutations that completely contain the new one where we can adjust
  // the length, and mutations that occur partially within the new one.
  const lengthDiff: number = newLength - originalLength;

  const mutationAfterChange: boolean = originalOffset + originalLength <= mutation.offset;
  if (mutationAfterChange) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + lengthDiff
    });
  }

  const mutationContainsChange = originalOffset >= mutation.offset
    && originalOffset + originalLength <= mutation.offset + mutation.length;
  if (mutationContainsChange) {
    return Object.assign({}, mutation, {
      length: mutation.length + lengthDiff
    });
  }

  const mutationWithinPrefixChange = mutation.offset >= originalOffset
    && mutation.offset + mutation.length <= originalOffset + originalLength
    && prefixLength > 0;
  if (mutationWithinPrefixChange) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + prefixLength
    });
  }

  const mutationContainsPrefix = mutation.offset < originalOffset
    && mutation.offset + mutation.length <= originalOffset + originalLength
    && prefixLength > 0;
  if (mutationContainsPrefix) {
    return [
      Object.assign({}, mutation, {
        length: originalOffset - mutation.offset
      }),
      Object.assign({}, mutation, {
        offset: originalOffset + prefixLength,
        length: mutation.offset - originalOffset + mutation.length
      })
    ];
  }

  const mutationContainsSuffix = mutation.offset >= originalOffset
    && mutation.offset + mutation.length > originalOffset + originalLength
    && suffixLength > 0;
  if (mutationContainsSuffix) {
    return [
      Object.assign({}, mutation, {
        offset: mutation.offset + prefixLength,
        length: originalOffset + originalLength - mutation.offset
      }),
      Object.assign({}, mutation, {
        offset: originalOffset + originalLength + prefixLength + suffixLength,
        length:
          mutation.offset + mutation.length
          - (originalOffset + originalLength)
      })
    ];
  }

  return mutation;
}
