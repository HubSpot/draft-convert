import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import splitReactElement from './splitReactElement';

function hasChildren(element) {
  return React.isValidElement(element) && React.Children.count(element.props.children) > 0;
}

export default function getBlockTags(blockHTML) {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  );

  if (React.isValidElement(blockHTML)) {
    if (hasChildren(blockHTML)) {
      return ReactDOMServer.renderToStaticMarkup(blockHTML);
    }

    return splitReactElement(blockHTML);
  }

  if (blockHTML.hasOwnProperty('element') && React.isValidElement(blockHTML.element)) {
    return Object.assign({}, blockHTML, splitReactElement(blockHTML.element));
  }

  invariant(
    blockHTML.hasOwnProperty('start') && blockHTML.hasOwnProperty('end'),
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  );

  return blockHTML;
}
