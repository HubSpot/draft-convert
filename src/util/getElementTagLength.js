import React from 'react';
import splitReactElement from './splitReactElement';

const getElementTagLength = (element, type = 'start') => {
  if (React.isValidElement(element)) {
    const splitElement = splitReactElement(element);
    if (typeof splitElement === 'string') {
      return 0;
    }

    const length = splitElement[type].length;

    const child = React.Children.toArray(element.props.children)[0];
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
