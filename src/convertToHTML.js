// import Immutable from 'immutable'; // eslint-disable-line no-unused-vars
import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { convertToRaw } from 'draft-js';

import encodeBlock from './encodeBlock';
import blockEntities from './blockEntities';
import blockInlineStyles from './blockInlineStyles';

import accumulateFunction from './util/accumulateFunction';
import blockTypeObjectFunction from './util/blockTypeObjectFunction';
import getBlockTags from './util/getBlockTags';
import getNestedBlockTags from './util/getNestedBlockTags';

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
}) => contentState => {
  invariant(
    contentState !== null && contentState !== undefined,
    'Expected contentState to be non-null'
  );

  let getBlockHTML;
  if (blockToHTML.__isMiddleware === true) {
    getBlockHTML = blockToHTML(blockTypeObjectFunction(defaultBlockHTML));
  } else {
    getBlockHTML = accumulateFunction(
      blockTypeObjectFunction(blockToHTML),
      blockTypeObjectFunction(defaultBlockHTML)
    );
  }

  const rawState = convertToRaw(contentState);

  let listStack = [];

  let result = rawState.blocks.map(block => {
    const {
      type,
      depth
    } = block;

    let closeNestTags = '';
    let openNestTags = '';

    if (NESTED_BLOCK_TYPES.indexOf(type) === -1) {
      // this block can't be nested, so reset all nesting if necessary
      closeNestTags = listStack.reduceRight((string, nestedBlock) => {
        return string + getNestedBlockTags(getBlockHTML(nestedBlock)).nestEnd;
      }, '');
      listStack = [];
    } else {
      while (depth + 1 !== listStack.length || type !== listStack[depth].type) {
        if (depth + 1 === listStack.length) {
          // depth is right but doesn't match type
          const blockToClose = listStack[depth];
          closeNestTags += getNestedBlockTags(getBlockHTML(blockToClose)).nestEnd;
          openNestTags += getNestedBlockTags(getBlockHTML(block)).nestStart;
          listStack[depth] = block;
        } else if (depth + 1 < listStack.length) {
          const blockToClose = listStack[listStack.length - 1];
          closeNestTags += getNestedBlockTags(getBlockHTML(blockToClose)).nestEnd;
          listStack = listStack.slice(0, -1);
        } else {
          openNestTags += getNestedBlockTags(getBlockHTML(block)).nestStart;
          listStack.push(block);
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

    const blockHTML = getBlockTags(
      getBlockHTML(block)
    );

    let html;

    if (typeof blockHTML === 'string') {
      html = blockHTML;
    } else {
      html = blockHTML.start + innerHTML + blockHTML.end;
    }

    if (innerHTML.length === 0 && Object.prototype.hasOwnProperty.call(blockHTML, 'empty')) {
      if (React.isValidElement(blockHTML.empty)) {
        html = ReactDOMServer.renderToStaticMarkup(
          blockHTML.empty
        );
      } else {
        html = blockHTML.empty;
      }
    }

    return closeNestTags + openNestTags + html;
  }).join('');

  result = listStack.reduce((res, nestBlock) => {
    return res + getNestedBlockTags(getBlockHTML(nestBlock)).nestEnd;
  }, result);

  return result;
};

export default (...args) => {
  if (args.length === 1 && Object.prototype.hasOwnProperty.call(args[0], '_map') && args[0].getBlockMap != null) {
    // skip higher-order function and use defaults
    return convertToHTML({})(...args);
  }

  return convertToHTML(...args);
};
