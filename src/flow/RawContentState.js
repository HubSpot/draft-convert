import type { RawBlock } from './RawBlock';
import type { RawEntity } from './RawEntity';

export type RawContentState = {
  blocks: Array<RawBlock>,
  entityMap: {[key: string]: RawEntity}
};
