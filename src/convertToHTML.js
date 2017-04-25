// @flow

import invariant from 'invariant';
import { ContentState, convertToRaw } from 'draft-js';

import encodeBlock from './encodeBlock';
import blockEntities from './blockEntities';
import blockInlineStyles from './blockInlineStyles';

import accumulateFunction from './util/accumulateFunction';
import blockTypeObjectFunction from './util/blockTypeObjectFunction';
import getBlockTags from './util/getBlockTags';
import { getNestStart, getNestEnd } from './util/getNestedBlockTags';

import defaultBlockHTML from './default/defaultBlockHTML';

import type { RawContentState } from './flow/RawContentState';
import type { RawBlock } from './flow/RawBlock';
import type { BlockMarkup, BlockTagObject } from './flow/Markup';

const NESTED_BLOCK_TYPES = [
  'ordered-list-item',
  'unordered-list-item'
];

const defaultEntityToHTML = (entity, originalText) => {
  return originalText;
};

const convertToHTML = ({
  styleToHTML = {},
  blockToHTML = {},
  entityToHTML = defaultEntityToHTML
}) => (contentState: ContentState): string => {
  invariant(
    contentState !== null && contentState !== undefined,
    'Expected contentState to be non-null'
  );

  let getBlockHTML: (RawBlock) => ?BlockMarkup;
  if (typeof blockToHTML === 'function' && blockToHTML.__isMiddleware === true) {
    getBlockHTML = blockToHTML(blockTypeObjectFunction(defaultBlockHTML));
  } else {
    getBlockHTML = accumulateFunction(
      blockTypeObjectFunction(blockToHTML),
      blockTypeObjectFunction(defaultBlockHTML)
    );
  }

  const rawState: RawContentState = convertToRaw(contentState);

  let listStack: Array<RawBlock> = [];

  let result = rawState.blocks.map((block: RawBlock) => {
    const {
      type,
      depth
    } = block;

    let closeNestTags = '';
    let openNestTags = '';

    if (NESTED_BLOCK_TYPES.indexOf(type) === -1) {
      // this block can't be nested, so reset all nesting if necessary
      closeNestTags = listStack.reduceRight((string, nestedBlock) => {
        return string + getNestEnd(getBlockTags(getBlockHTML(nestedBlock)));
      }, '');
      listStack = [];
    } else {
      while (depth != null && (depth + 1 !== listStack.length || type !== listStack[depth].type)) { // eslint-disable-line no-unmodified-loop-condition
        if (depth + 1 === listStack.length) {
          // depth is right but doesn't match type
          const blockToClose = listStack[depth];
          closeNestTags += getNestEnd(getBlockTags(getBlockHTML(blockToClose)));
          openNestTags += getNestStart(getBlockTags(getBlockHTML(block)));
          listStack[depth] = block;
        } else if (depth + 1 < listStack.length) {
          const blockToClose = listStack[listStack.length - 1];
          closeNestTags += getNestEnd(getBlockTags(getBlockHTML(blockToClose)));
          listStack = listStack.slice(0, -1);
        } else {
          openNestTags += getNestStart(getBlockTags(getBlockHTML(block)));
          listStack.push(block);
        }
      }
    }

    const innerHTML: string = blockInlineStyles(
      blockEntities(
        encodeBlock(
          block
        ),
        rawState.entityMap,
        entityToHTML
      ),
      styleToHTML
    );

    const blockHTML: string | BlockTagObject = getBlockTags(
      getBlockHTML(block)
    );

    let html;

    if (!blockHTML) {
      html = innerHTML;
    } else if (typeof blockHTML === 'string') {
      html = blockHTML;
    } else {
      html = blockHTML.start + innerHTML + blockHTML.end;

      if (innerHTML.length === 0 && blockHTML.empty) {
        html = blockHTML.empty;
      }
    }

    return closeNestTags + openNestTags + html;
  }).join('');

  result = listStack.reduce((res, nestBlock) => {
    return res + getNestEnd(getBlockTags(getBlockHTML(nestBlock)));
  }, result);

  return result;
};

export default (...args: Array<any>) => {
  if (args.length === 1 && Object.prototype.hasOwnProperty.call(args[0], '_map') && args[0].getBlockMap != null) {
    // skip higher-order function and use defaults
    return convertToHTML({})(...args);
  }

  return convertToHTML(...args);
};
