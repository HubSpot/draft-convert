import React from 'react';
import splitReactElement from './splitReactElement';

export default (element, type = 'start') => {
  if (React.isValidElement(element)) {
    return splitReactElement(element)[type].length;
  }

  if (typeof element === 'object') {
    return element[type] ? element[type].length : 0;
  }

  return 0;
};
