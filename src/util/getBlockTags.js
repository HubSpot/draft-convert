// @flow

import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import splitReactElement from './splitReactElement';
import { getNestedBlockTags } from './getNestedBlockTags';

import type { BlockMarkup, BlockTagObject, TagObject } from '../flow/Markup';

function hasChildren(element: React.Element<any>): boolean {
  return React.Children.count(element.props.children) > 0;
}

export default function getBlockTags(blockHTML: ?BlockMarkup): string | BlockTagObject {
  if (!blockHTML) {
    return {
      start: '',
      end: ''
    };
  }
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  );

  if (typeof blockHTML === 'string') {
    return blockHTML;
  }

  if (React.isValidElement(blockHTML)) {
    const verifiedElement = ((blockHTML: any): React.Element<any>);

    if (hasChildren(verifiedElement)) {
      return ReactDOMServer.renderToStaticMarkup(verifiedElement);
    }

    const result: TagObject | string = splitReactElement(verifiedElement);

    if (typeof result === 'string') {
      return result;
    } else if (result.start && result.end) {
      return ((result: any): BlockTagObject);
    }
  }

  if (typeof blockHTML === 'object') {
    let result: BlockTagObject = Object.assign({}, {
      start: '',
      end: ''
    });

    if (blockHTML.element && React.isValidElement(blockHTML.element)) {
      const verifiedElement = ((blockHTML.element: any): React.Element<any>);
      const splitElement: TagObject | string = splitReactElement(verifiedElement);

      if (typeof splitElement === 'string') {
        return splitElement;
      }

      result = Object.assign({}, result, splitElement);
    }

    if (blockHTML.start && blockHTML.end) {
      const { start, end } = blockHTML;
      result = Object.assign({}, result, {start, end});
    }

    if (blockHTML.nest || (blockHTML.nestStart && blockHTML.nestEnd)) {
      result = Object.assign({}, result, getNestedBlockTags(blockHTML));
    }

    if (blockHTML.empty) {
      if (typeof blockHTML.empty === 'string') {
        result = Object.assign({}, result, { empty: blockHTML.empty });
      }

      if (React.isValidElement(blockHTML.empty)) {
        const verifiedElement = ((blockHTML.empty: any): React.Element<any>);
        result = Object.assign({}, result, {
          empty: ReactDOMServer.renderToStaticMarkup(verifiedElement)
        });
      }
    }

    return result;
  }

  throw new Error(
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  );
}
