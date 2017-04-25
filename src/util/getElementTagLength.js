// @flow

import React from 'react';
import splitReactElement from './splitReactElement';

import type { Markup } from '../flow/Markup';

export default (element: Markup, type: string = 'start'): number => {
  if (React.isValidElement(element)) {
    const verifiedElement = ((element: any): React.Element<any>);

    if (React.Children.count(verifiedElement.props.children) === 0) {
      const splitElement = splitReactElement(verifiedElement);

      if (typeof splitElement === 'object') {
        return splitElement[type].length;
      }
    }
  }

  if (typeof element === 'object') {
    return element[type] ? element[type].length : 0;
  }

  return 0;
};
