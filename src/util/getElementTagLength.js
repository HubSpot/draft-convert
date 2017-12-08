// @flow

import React from 'react';
import splitReactElement from './splitReactElement';

import type { Markup } from '../flow/Markup';

const getElementTagLength = (element: Markup, type: string = 'start'): number => {
  if (React.isValidElement(element)) {
    const verifiedElement = ((element: any): React.Element<any>);
    const splitElement = splitReactElement(verifiedElement);

    if (typeof splitElement === 'string') {
      return 0;
    }

    const length: number = splitElement[type].length;

    const child: React.Element<any> = React.Children.toArray(verifiedElement.props.children)[0];
    return length + (child && React.isValidElement(child)
      ? getElementTagLength(child, type)
      : 0
    );
  }

  if (typeof element === 'object') {
    return element[type] ? element[type].length : 0;
  }

  return 0;
};

export default getElementTagLength;
