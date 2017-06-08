import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// see http://w3c.github.io/html/syntax.html#writing-html-documents-elements
const VOID_TAGS = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
};

const SPLITTER_STRING = String(Math.random());

export default function splitReactElement(element) {
  if (VOID_TAGS[element.type]) {
    return ReactDOMServer.renderToStaticMarkup(element);
  }

  const tags = ReactDOMServer.renderToStaticMarkup(
    React.cloneElement(
      element,
      {},
      SPLITTER_STRING
    )
  ).split(SPLITTER_STRING);

  invariant(
    tags.length > 1,
    `convertToHTML: Element of type ${element.type} must render children`
  );

  return {
    start: tags[0],
    end: tags[1]
  };
}
