import invariant from 'invariant';
import React from 'react';
import splitReactElement from './splitReactElement';

export default function getNestedBlockTags(blockHTML, depth) {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  );

  if (typeof blockHTML.nest === 'function') {
    const { start, end } = splitReactElement(blockHTML.nest(depth));
    return Object.assign({}, blockHTML, {
      nestStart: start,
      nestEnd: end,
    });
  }

  if (React.isValidElement(blockHTML.nest)) {
    const { start, end } = splitReactElement(blockHTML.nest);
    return Object.assign({}, blockHTML, {
      nestStart: start,
      nestEnd: end,
    });
  }

  invariant(
    Object.prototype.hasOwnProperty.call(blockHTML, 'nestStart') &&
      Object.prototype.hasOwnProperty.call(blockHTML, 'nestEnd'),
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  );

  return blockHTML;
}
