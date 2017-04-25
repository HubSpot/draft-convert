// @flow

import type { BlockMarkup } from '../flow/Markup';
import type { RawBlock } from '../flow/RawBlock';

export default (typeObject: ((any) => ?BlockMarkup) | {[type: string] : BlockMarkup}) => (block: RawBlock): ?BlockMarkup => {
  if (typeof typeObject === 'function') {
    // handle case where typeObject is already a function
    return typeObject(block);
  }

  return typeObject[block.type];
};
