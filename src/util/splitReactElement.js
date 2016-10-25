import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

export default function splitReactElement(element) {
  const tags = ReactDOMServer.renderToStaticMarkup(
    React.cloneElement(
      element,
      {},
      '\r'
    )
  ).split('\r');

  invariant(
    tags.length > 1,
    `convertToHTML: Element of type ${element.type} must render children`
  );

  invariant(
    tags.length < 3,
    `convertToHTML: Element of type ${element.type} cannot use carriage return character`
  );

  return {
    start: tags[0],
    end: tags[1]
  };
}
