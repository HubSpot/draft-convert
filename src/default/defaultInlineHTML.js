import React from 'react';

export default function defaultInlineHTML(style) {
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
        end: '',
      };
  }
}
