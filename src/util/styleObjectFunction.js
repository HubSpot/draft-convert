// @flow

import type { InlineStyleMarkup } from '../flow/Markup';

export default (
  object:
    | { [style: string]: InlineStyleMarkup }
    | ((style: string) => ?InlineStyleMarkup)
) => {
  return (style: string): ?InlineStyleMarkup => {
    if (typeof object === 'function') {
      return object(style);
    }

    return object[style];
  };
};
