// @flow

import invariant from 'invariant';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import splitReactElement from './splitReactElement';

import type { TagObject } from '../flow/Markup';

function hasChildren(element: React.Element<any>): boolean {
  return React.Children.count(element.props.children) > 0;
}

export default function getElementHTML(
  element: ?(React.Element<any> | string | TagObject)
): ?(TagObject | string) {
  if (element === undefined || element === null) {
    return element;
  }

  if (typeof element === 'string') {
    return element;
  }

  if (React.isValidElement(element)) {
    const verifiedElement = ((element: any): React.Element<any>);

    if (hasChildren(verifiedElement)) {
      return ReactDOMServer.renderToStaticMarkup(verifiedElement);
    }

    return splitReactElement(verifiedElement);
  }

  invariant(
    typeof element === 'object' &&
    element.start &&
    element.end,
    'convertToHTML: received conversion data without either an HTML string, ReactElement or an object with start/end tags'
  );

  return element;
};
