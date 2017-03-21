/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the /src directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import { List, OrderedSet, Map } from 'immutable';
import { ContentState, CharacterMetadata, ContentBlock, genKey } from 'draft-js';
import getSafeBodyFromHTML from './util/parseHTML';
import rangeSort from './util/rangeSort';

const NBSP = '&nbsp;';
const SPACE = ' ';

// Arbitrary max indent
const MAX_DEPTH = 4;

// used for replacing characters in HTML
/* eslint-disable no-control-regex */
const REGEX_CR = new RegExp('\r', 'g');
const REGEX_LF = new RegExp('\n', 'g');
const REGEX_NBSP = new RegExp(NBSP, 'g');
const REGEX_BLOCK_DELIMITER = new RegExp('\r', 'g');
/* eslint-enable no-control-regex */

// Block tag flow is different because LIs do not have
// a deterministic style ;_;
const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre'];
const inlineTags = {
  b: 'BOLD',
  code: 'CODE',
  del: 'STRIKETHROUGH',
  em: 'ITALIC',
  i: 'ITALIC',
  s: 'STRIKETHROUGH',
  strike: 'STRIKETHROUGH',
  strong: 'BOLD',
  u: 'UNDERLINE',
};


const handleMiddleware = (maybeMiddleware, base) => {
  if (maybeMiddleware && maybeMiddleware.__isMiddleware === true) {
    return maybeMiddleware(base);
  }

  return maybeMiddleware;
};

const defaultHTMLToBlock = (nodeName, node, lastList) => {
  return undefined;
};

const defaultHTMLToStyle = (nodeName, node, currentStyle) => {
  return currentStyle;
};

const defaultHTMLToEntity = (nodeName, node) => {
  return undefined;
};

const defaultTextToEntity = text => {
  return [];
};

const nullthrows = x => {
  if (x != null) {
    return x;
  }
  throw new Error('Got unexpected null or undefined');
};

const sanitizeDraftText = input => {
  return input.replace(REGEX_BLOCK_DELIMITER, '');
};

function getEmptyChunk() {
  return {
    text: '',
    inlines: [],
    entities: [],
    blocks: [],
  };
}

function getWhitespaceChunk(inEntity) {
  const entities = new Array(1);
  if (inEntity) {
    entities[0] = inEntity;
  }
  return {
    text: SPACE,
    inlines: [OrderedSet()],
    entities,
    blocks: [],
  };
}

function getSoftNewlineChunk(block, depth, flat = false, data = Map()) {
  if (flat === true) {
    return {
      text: '\r',
      inlines: [OrderedSet()],
      entities: new Array(1),
      blocks: [{
        type: block,
        data,
        depth: Math.max(0, Math.min(MAX_DEPTH, depth))
      }],
      isNewline: true
    };
  }

  return {
    text: '\n',
    inlines: [OrderedSet()],
    entities: new Array(1),
    blocks: []
  };
}

function getBlockDividerChunk(block, depth, data = Map()) {
  return {
    text: '\r',
    inlines: [OrderedSet()],
    entities: new Array(1),
    blocks: [{
      type: block,
      data,
      depth: Math.max(0, Math.min(MAX_DEPTH, depth)),
    }],
  };
}

function getBlockTypeForTag(tag, lastList) {
  switch (tag) {
    case 'h1':
      return 'header-one';
    case 'h2':
      return 'header-two';
    case 'h3':
      return 'header-three';
    case 'h4':
      return 'header-four';
    case 'h5':
      return 'header-five';
    case 'h6':
      return 'header-six';
    case 'li':
      if (lastList === 'ol') {
        return 'ordered-list-item';
      }
      return 'unordered-list-item';
    case 'blockquote':
      return 'blockquote';
    case 'pre':
      return 'code-block';
    case 'div':
    case 'p':
      return 'unstyled';
    default:
      return null;
  }
}

function baseCheckBlockType(nodeName, node, lastList) {
  return getBlockTypeForTag(nodeName, lastList);
}

function processInlineTag(
  tag,
  node,
  currentStyle
) {
  const styleToCheck = inlineTags[tag];
  if (styleToCheck) {
    currentStyle = currentStyle.add(styleToCheck).toOrderedSet();
  } else if (node instanceof HTMLElement) {
    const htmlElement = node;
    currentStyle = currentStyle.withMutations(style => {
      if (htmlElement.style.fontWeight === 'bold') {
        style.add('BOLD');
      }

      if (htmlElement.style.fontStyle === 'italic') {
        style.add('ITALIC');
      }

      if (htmlElement.style.textDecoration === 'underline') {
        style.add('UNDERLINE');
      }

      if (htmlElement.style.textDecoration === 'line-through') {
        style.add('STRIKETHROUGH');
      }
    }).toOrderedSet();
  }
  return currentStyle;
}

function baseProcessInlineTag(tag, node) {
  return processInlineTag(tag, node, OrderedSet());
}

function joinChunks(A, B, flat = false) {
  // Sometimes two blocks will touch in the DOM and we need to strip the
  // extra delimiter to preserve niceness.
  const firstInB = B.text.slice(0, 1);
  const lastInA = A.text.slice(-1);

  const adjacentDividers = lastInA === '\r' && firstInB === '\r';
  const isJoiningBlocks = A.text !== '\r' && B.text !== '\r'; // when joining two full blocks like this we want to pop one divider
  const addingNewlineToEmptyBlock = (A.text === '\r' && !A.isNewline) && B.isNewline; // when joining a newline to an empty block we want to remove the newline

  if (adjacentDividers && (isJoiningBlocks || addingNewlineToEmptyBlock)) {
    A.text = A.text.slice(0, -1);
    A.inlines.pop();
    A.entities.pop();
    A.blocks.pop();
  }

  // Kill whitespace after blocks if flat mode is on
  if (
    A.text.slice(-1) === '\r' && flat === true
  ) {
    if (B.text === SPACE || B.text === '\n') {
      return A;
    } else if (firstInB === SPACE || firstInB === '\n') {
      B.text = B.text.slice(1);
      B.inlines.shift();
      B.entities.shift();
    }
  }

  const isNewline = A.text.length === 0 && B.isNewline;

  return {
    text: A.text + B.text,
    inlines: A.inlines.concat(B.inlines),
    entities: A.entities.concat(B.entities),
    blocks: A.blocks.concat(B.blocks),
    isNewline
  };
}

/*
 * Check to see if we have anything like <p> <blockquote> <h1>... to create
 * block tags from. If we do, we can use those and ignore <div> tags. If we
 * don't, we can treat <div> tags as meaningful (unstyled) blocks.
 */
function containsSemanticBlockMarkup(html) {
  return blockTags.some(tag => html.indexOf(`<${tag}`) !== -1);
}

function genFragment(
  node,
  inlineStyle,
  lastList,
  inBlock,
  fragmentBlockTags,
  depth,
  processCustomInlineStyles,
  checkEntityNode,
  checkEntityText,
  checkBlockType,
  options,
  inEntity
) {
  let nodeName = node.nodeName.toLowerCase();
  let newBlock = false;
  let nextBlockType = 'unstyled';

  // Base Case
  if (nodeName === '#text') {
    let text = node.textContent;
    if (text.trim() === '' && inBlock === null) {
      return getEmptyChunk();
    }

    if (text.trim() === '' && inBlock !== 'code-block') {
      return getWhitespaceChunk(inEntity);
    }
    if (inBlock !== 'code-block') {
      // Can't use empty string because MSWord
      text = text.replace(REGEX_LF, SPACE);
    }

    const entities = Array(text.length).fill(inEntity);

    let offsetChange = 0;
    const textEntities = checkEntityText(text).sort(rangeSort);
    textEntities.forEach(({ entity, offset, length, result }) => {
      const adjustedOffset = offset + offsetChange;

      if (result === null || result === undefined) {
        result = text.substr(adjustedOffset, length);
      }

      const textArray = text.split('');
      textArray.splice.bind(textArray, adjustedOffset, length).apply(textArray, result.split(''));
      text = textArray.join('');

      entities.splice
        .bind(entities, adjustedOffset, length)
        .apply(entities, Array(result.length).fill(entity));
      offsetChange += result.length - length;
    });

    return {
      text,
      inlines: Array(text.length).fill(inlineStyle),
      entities,
      blocks: [],
    };
  }

  // BR tags
  if (nodeName === 'br') {
    const blockType = inBlock;

    if (blockType === null) {
      //  BR tag is at top level, treat it as an unstyled block
      return getSoftNewlineChunk('unstyled', depth, true);
    }

    return getSoftNewlineChunk(blockType || 'unstyled', depth, options.flat);
  }

  let chunk = getEmptyChunk();
  let newChunk = null;

  // Inline tags
  inlineStyle = processInlineTag(nodeName, node, inlineStyle);
  inlineStyle = processCustomInlineStyles(nodeName, node, inlineStyle);

  // Handle lists
  if (nodeName === 'ul' || nodeName === 'ol') {
    if (lastList) {
      depth += 1;
    }
    lastList = nodeName;
    inBlock = null;
  }

  // Block Tags
  const blockInfo = checkBlockType(nodeName, node, lastList, inBlock) || {};
  let blockType;
  let blockDataMap;
  if (typeof blockInfo === 'string') {
    blockType = blockInfo;
    blockDataMap = Map();
  } else {
    blockType = typeof blockInfo === 'string' ? blockInfo : blockInfo.type;
    blockDataMap = blockInfo.data ? Map(blockInfo.data) : Map();
  }
  if (!inBlock && (fragmentBlockTags.indexOf(nodeName) !== -1 || blockType)) {
    chunk = getBlockDividerChunk(
      blockType || getBlockTypeForTag(nodeName, lastList),
      depth,
      blockDataMap
    );
    inBlock = blockType || getBlockTypeForTag(nodeName, lastList);
    newBlock = true;
  } else if (lastList && (inBlock === 'ordered-list-item' || inBlock === 'unordered-list-item') && nodeName === 'li') {
    const listItemBlockType = getBlockTypeForTag(nodeName, lastList);
    chunk = getBlockDividerChunk(
      listItemBlockType,
      depth
    );
    inBlock = listItemBlockType;
    newBlock = true;
    nextBlockType = lastList === 'ul' ? 'unordered-list-item' : 'ordered-list-item';
  } else if (inBlock && inBlock !== 'atomic' && blockType === 'atomic') {
    inBlock = blockType;
    newBlock = true;
    chunk = getSoftNewlineChunk(
      blockType,
      depth,
      true, // atomic blocks within non-atomic blocks must always be split out
      blockDataMap
    );
  }

  // Recurse through children
  let child = node.firstChild;

  // hack to allow conversion of atomic blocks from HTML (e.g. <figure><img
  // src="..." /></figure>). since metadata must be stored on an entity text
  // must exist for the entity to apply to. the way chunks are joined strips
  // whitespace at the end so it cannot be a space character.

  if (child == null && inEntity && (blockType === 'atomic' || inBlock === 'atomic')) {
    child = document.createTextNode('a');
  }

  if (child != null) {
    nodeName = child.nodeName.toLowerCase();
  }

  let entityId = null;

  while (child) {
    entityId = checkEntityNode(nodeName, child);

    newChunk = genFragment(
      child,
      inlineStyle,
      lastList,
      inBlock,
      fragmentBlockTags,
      depth,
      processCustomInlineStyles,
      checkEntityNode,
      checkEntityText,
      checkBlockType,
      options,
      entityId || inEntity
    );

    chunk = joinChunks(chunk, newChunk, options.flat);
    const sibling = child.nextSibling;

    // Put in a newline to break up blocks inside blocks
    if (
      sibling
      && fragmentBlockTags.indexOf(nodeName) >= 0
      && inBlock
    ) {
      const newBlockInfo = checkBlockType(nodeName, child, lastList, inBlock) || {};

      let newBlockType;
      let newBlockData;

      if (typeof newBlockInfo === 'string') {
        newBlockType = newBlockInfo;
        newBlockData = Map();
      } else {
        newBlockType = newBlockInfo.type || getBlockTypeForTag(nodeName, lastList);
        newBlockData = newBlockInfo.data ? Map(newBlockInfo.data) : Map();
      }

      chunk = joinChunks(
        chunk,
        getSoftNewlineChunk(
          newBlockType,
          depth,
          options.flat,
          newBlockData
        ),
        options.flat
      );
    }
    if (sibling) {
      nodeName = sibling.nodeName.toLowerCase();
    }
    child = sibling;
  }

  if (newBlock) {
    chunk = joinChunks(
      chunk,
      getBlockDividerChunk(nextBlockType, depth, Map()),
      options.flat
    );
  }

  return chunk;
}

function getChunkForHTML(
  html,
  processCustomInlineStyles,
  checkEntityNode,
  checkEntityText,
  checkBlockType,
  options,
  DOMBuilder
) {
  html = html
    .trim()
    .replace(REGEX_CR, '')
    .replace(REGEX_NBSP, SPACE);

  const safeBody = DOMBuilder(html);
  if (!safeBody) {
    return null;
  }

  // Sometimes we aren't dealing with content that contains nice semantic
  // tags. In this case, use divs to separate everything out into paragraphs
  // and hope for the best.
  const workingBlocks = containsSemanticBlockMarkup(html) ? blockTags.concat(['div']) : ['div'];

  // Start with -1 block depth to offset the fact that we are passing in a fake
  // UL block to sta rt with.
  let chunk = genFragment(
    safeBody,
    OrderedSet(),
    'ul',
    null,
    workingBlocks,
    -1,
    processCustomInlineStyles,
    checkEntityNode,
    checkEntityText,
    checkBlockType,
    options
  );

  // join with previous block to prevent weirdness on paste
  if (chunk.text.indexOf('\r') === 0) {
    chunk = {
      text: chunk.text.slice(1),
      inlines: chunk.inlines.slice(1),
      entities: chunk.entities.slice(1),
      blocks: chunk.blocks,
    };
  }

  // Kill block delimiter at the end
  if (chunk.text.slice(-1) === '\r') {
    chunk.text = chunk.text.slice(0, -1);
    chunk.inlines = chunk.inlines.slice(0, -1);
    chunk.entities = chunk.entities.slice(0, -1);
    chunk.blocks.pop();
  }

  // If we saw no block tags, put an unstyled one in
  if (chunk.blocks.length === 0) {
    chunk.blocks.push({ type: 'unstyled', data: Map(), depth: 0 });
  }

  // Sometimes we start with text that isn't in a block, which is then
  // followed by blocks. Need to fix up the blocks to add in
  // an unstyled block for this content
  if (chunk.text.split('\r').length === chunk.blocks.length + 1) {
    chunk.blocks.unshift({ type: 'unstyled', data: Map(), depth: 0 });
  }

  return chunk;
}

function convertFromHTMLtoContentBlocks(
  html,
  processCustomInlineStyles,
  checkEntityNode,
  checkEntityText,
  checkBlockType,
  options,
  DOMBuilder
) {
  // Be ABSOLUTELY SURE that the dom builder you pass hare won't execute
  // arbitrary code in whatever environment you're running this in. For an
  // example of how we try to do this in-browser, see getSafeBodyFromHTML.

  const chunk = getChunkForHTML(
    html,
    processCustomInlineStyles,
    checkEntityNode,
    checkEntityText,
    checkBlockType,
    options,
    DOMBuilder
  );
  if (chunk == null) {
    return [];
  }
  let start = 0;
  return chunk.text.split('\r').map(
    (textBlock, blockIndex) => {
      // Make absolutely certain that our text is acceptable.
      textBlock = sanitizeDraftText(textBlock);
      const end = start + textBlock.length;
      const inlines = nullthrows(chunk).inlines.slice(start, end);
      const entities = nullthrows(chunk).entities.slice(start, end);
      const characterList = List(
        inlines.map((style, entityIndex) => {
          const data = { style, entity: null };
          if (entities[entityIndex]) {
            data.entity = entities[entityIndex];
          }
          return CharacterMetadata.create(data);
        })
      );
      start = end + 1;

      return new ContentBlock({
        key: genKey(),
        type: nullthrows(chunk).blocks[blockIndex].type,
        data: nullthrows(chunk).blocks[blockIndex].data,
        depth: nullthrows(chunk).blocks[blockIndex].depth,
        text: textBlock,
        characterList,
      });
    }
  );
}

const convertFromHTML = ({
  htmlToStyle = defaultHTMLToStyle,
  htmlToEntity = defaultHTMLToEntity,
  textToEntity = defaultTextToEntity,
  htmlToBlock = defaultHTMLToBlock,
}) => (
  html,
  options = {
    flat: false
  },
  DOMBuilder = getSafeBodyFromHTML
) => {
  return ContentState.createFromBlockArray(
    convertFromHTMLtoContentBlocks(
      html,
      handleMiddleware(htmlToStyle, baseProcessInlineTag),
      handleMiddleware(htmlToEntity, defaultHTMLToEntity),
      handleMiddleware(textToEntity, defaultTextToEntity),
      handleMiddleware(htmlToBlock, baseCheckBlockType),
      options,
      DOMBuilder
    )
  );
};

export default (...args) => {
  if (args.length >= 1 && typeof args[0] === 'string') {
    return convertFromHTML({})(...args);
  }
  return convertFromHTML(...args);
};
