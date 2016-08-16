// import Immutable from 'immutable'; // eslint-disable-line no-unused-vars
import invariant from 'invariant';
import {convertToRaw} from 'draft-js';
import encodeBlock from './encodeBlock';
import blockEntities from './blockEntities';
import blockInlineStyles from './blockInlineStyles';
import defaultBlockHTML from './default/defaultBlockHTML';
import accumulateFunction from './util/accumulateFunction';
import blockTypeObjectFunction from './util/blockTypeObjectFunction';

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
}) => (contentState) => {
  invariant(
    contentState !== null && contentState !== undefined,
    'Expected contentState to be non-null'
  );

  const blockHTML = accumulateFunction(
    blockTypeObjectFunction(blockToHTML),
    blockTypeObjectFunction(defaultBlockHTML)
  );

  const rawState = convertToRaw(contentState);

  let listStack = [];

  let result = rawState.blocks.map((block) => {
    const {
      type,
      depth
    } = block;

    let closeNestTags = '';
    let openNestTags = '';

    if (NESTED_BLOCK_TYPES.indexOf(type) === -1) {
      // this block can't be nested, so reset all nesting if necessary
      closeNestTags = listStack.reduceRight((string, nestedBlock) => {
        return string + blockHTML(nestedBlock).nestEnd;
      }, '');
      listStack = [];
    } else {
      while (depth + 1 !== listStack.length || type !== listStack[depth].type) {
        if (depth + 1 === listStack.length) {
          // depth is right but doesn't match type
          const blockToClose = listStack[depth];
          closeNestTags += blockHTML(blockToClose).nestEnd;
          openNestTags += blockHTML(block).nestStart;
          listStack[depth] = block;
        } else {
          if (depth + 1 < listStack.length) {
            const blockToClose = listStack[listStack.length - 1];
            closeNestTags += blockHTML(blockToClose).nestEnd;
            listStack = listStack.slice(0, -1);
          } else {
            openNestTags += blockHTML(block).nestStart;
            listStack.push(block);
          }
        }
      }
    }

    const innerHTML = blockInlineStyles(
      blockEntities(
        encodeBlock(
          block
        ),
        rawState.entityMap,
        entityToHTML
      ),
      styleToHTML
    );

    let html = blockHTML(block).start + innerHTML + blockHTML(block).end;
    if (innerHTML.length === 0 && blockHTML(block).hasOwnProperty('empty')) {
      html = blockHTML(block).empty;
    }

    return closeNestTags + openNestTags + html;
  }).join('');

  result = listStack.reduce((res, nestBlock) => {
    return res + blockHTML(nestBlock).nestEnd;
  }, result);

  return result;
};

export default (...args) => {
  if (args.length === 1 && args[0].hasOwnProperty('_map') && args[0].getBlockMap != null) {
    // skip higher-order function and use defaults
    return convertToHTML({})(...args);
  }

  return convertToHTML(...args);
};
