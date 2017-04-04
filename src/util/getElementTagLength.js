import React from 'react';
import splitReactElement from './splitReactElement';

export default (element, type) => {
  if (React.isValidElement(element) && React.Children.count(element.props.children) === 0) {
    return splitReactElement(element)[type].length;
  }

  if (typeof element === 'object') {
    return element[type] ? element[type].length : 0;
  }

  return 0;
};
