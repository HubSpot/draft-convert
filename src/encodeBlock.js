// @flow

import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';

import type { RawBlock } from './flow/RawBlock';
import type { InlineStyleRange, EntityRange, Mutation } from './flow/Mutations';

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;',
  '\n': '<br/>'
};

export default (block: RawBlock): RawBlock => {
  const blockText = block.text;

  let entities: Array<EntityRange> = block.entityRanges.sort(rangeSort);
  let styles: Array<InlineStyleRange> = block.inlineStyleRanges.sort(rangeSort);
  let resultText = '';

  for (let index = 0; index < blockText.length; index++) {
    const char = blockText[index];

    if (ENTITY_MAP[char] !== undefined) {
      const encoded = ENTITY_MAP[char];
      const resultIndex = resultText.length;
      resultText += encoded;

      const updateForChar = function<T: Mutation>(mutation: T): T {
        const result: T | Array<T> = updateMutation(
          mutation,
          resultIndex,
          char.length,
          encoded.length,
          0,
          0
        );

        if (Array.isArray(result)) {
          // since the original character is always length 1, it can't possibly
          // intersect with any other mutations. so we can ignore any additional
          // mutations generated (they won't be)
          return result[0];
        }

        return result;
      };

      entities = entities.map(updateForChar);
      styles = styles.map(updateForChar);
    } else {
      resultText += char;
    }
  }

  return Object.assign({}, block, {
    text: resultText,
    inlineStyleRanges: styles,
    entityRanges: entities
  });
};
