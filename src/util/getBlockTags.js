import invariant from 'invariant';
import React from 'react';
import splitReactElement from './splitReactElement';

export default function getBlockTags(blockHTML) {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  );

  if (React.isValidElement(blockHTML)) {
    return splitReactElement(blockHTML);
  }

  if (Object.prototype.hasOwnProperty.call(blockHTML, 'element') && React.isValidElement(blockHTML.element)) {
    return Object.assign({}, blockHTML, splitReactElement(blockHTML.element));
  }

  invariant(
    Object.prototype.hasOwnProperty.call(blockHTML, 'start') && Object.prototype.hasOwnProperty.call(blockHTML, 'end'),
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  );

  return blockHTML;
}
