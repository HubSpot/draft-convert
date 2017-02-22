import React from 'react';
import splitReactElement from './splitReactElement';

export default element => {
  if (React.isValidElement(element) && React.Children.count(element.props.children) === 0) {
    return splitReactElement(element).start.length;
  }

  if (typeof element === 'object') {
    return element.start ? element.start.length : 0;
  }

  return 0;
};
