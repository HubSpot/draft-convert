import React from 'react';
import ReactDOMServer from 'react-dom/server';

const IMAGE_PRELOADS =
  /<link rel="preload" (?:as="image"|href="[^"]*" as="image")[^>]*\/>/g;

const hoistsImagePreloads = parseInt(React.version, 10) >= 19;

export default function renderToStaticMarkup(element) {
  const html = ReactDOMServer.renderToStaticMarkup(element);
  return hoistsImagePreloads ? html.replace(IMAGE_PRELOADS, '') : html;
}
