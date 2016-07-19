// import Immutable from 'immutable'; // eslint-disable-line no-unused-vars
import invariant from 'invariant';
import {convertToRaw} from 'draft-js';
import encodeBlock from './encodeBlock';
import convertEntity from './convertEntity';
import blockInnerHTML from './blockInnerHTML';
import defaultBlockHTML from './default/defaultBlockHTML';

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

  const blockHTML = Object.assign({}, defaultBlockHTML, blockToHTML);
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
      closeNestTags = listStack.reduceRight((string, nestType) => {
        return string + blockHTML[nestType].nestEnd;
      }, '');
      listStack = [];
    } else {
      while (depth + 1 !== listStack.length || type !== listStack[depth]) {
        if (depth + 1 === listStack.length) {
          // depth is right but doesn't match type
          const typeToClose = listStack[depth];
          closeNestTags += blockHTML[typeToClose].nestEnd;
          openNestTags += blockHTML[type].nestStart;
          listStack[depth] = type;
        } else {
          if (depth + 1 < listStack.length) {
            const typeToClose = listStack[listStack.length - 1];
            closeNestTags += blockHTML[typeToClose].nestEnd;
            listStack = listStack.slice(0, -1);
          } else {
            openNestTags += blockHTML[type].nestStart;
            listStack.push(type);
          }
        }
      }
    }

    const innerHTML = blockInnerHTML(
      convertEntity(
        encodeBlock(
          block
        ),
        rawState.entityMap,
        entityToHTML
      ),
      styleToHTML
    );

    let html = blockHTML[type].start + innerHTML + blockHTML[type].end;
    if (innerHTML.length === 0 && blockHTML[type].hasOwnProperty('empty')) {
      html = blockHTML[type].empty;
    }

    return closeNestTags + openNestTags + html;
  }).join('');

  result = listStack.reduce((res, nestType) => {
    return res + blockHTML[nestType].nestEnd;
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
