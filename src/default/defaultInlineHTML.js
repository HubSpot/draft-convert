// @flow

import React from 'react';

import type { InlineStyleMarkup } from '../flow/Markup';

export default function defaultInlineHTML(style: string): InlineStyleMarkup {
  switch (style) {
  case 'BOLD':
    return <strong />;
  case 'ITALIC':
    return <em />;
  case 'UNDERLINE':
    return <u />;
  case 'CODE':
    return <code />;
  default:
    return {
      start: '',
      end: ''
    };
  }
}
