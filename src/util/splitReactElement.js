import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// see http://w3c.github.io/html/syntax.html#writing-html-documents-elements
const VOID_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

export default function splitReactElement(element) {
  if (VOID_TAGS.indexOf(element.type) !== -1) {
    return ReactDOMServer.renderToStaticMarkup(element);
  }

  const tags = ReactDOMServer.renderToStaticMarkup(
    React.cloneElement(element, {}, '\r')
  ).split('\r');

  invariant(
    tags.length > 1,
    `convertToHTML: Element of type ${element.type} must render children`
  );

  invariant(
    tags.length < 3,
    `convertToHTML: Element of type ${
      element.type
    } cannot use carriage return character`
  );

  return {
    start: tags[0],
    end: tags[1],
  };
}
