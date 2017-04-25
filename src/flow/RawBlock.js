// @flow

import type { InlineStyleRange, EntityRange } from './Mutations';

export type RawBlock = {
  key: ?string,
  type: string,
  text: string,
  depth: ?number,
  inlineStyleRanges: Array<InlineStyleRange>,
  entityRanges: Array<EntityRange>,
  data?: Object
};
