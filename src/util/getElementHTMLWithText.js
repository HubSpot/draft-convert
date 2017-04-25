// @flow

import React from 'react';
import getElementHTML from './getElementHTML';

import type { TagObject } from '../flow/Markup';

export default function getElementHTMLWithText(
  element: ?(React.Element<any> | TagObject | string),
  text: string
): ?string {
  const elementHTML: ?(TagObject | string) = getElementHTML(element);

  if (!elementHTML) {
    return null;
  }

  if (typeof elementHTML === 'string') {
    return elementHTML;
  }

  const {
    start,
    end
  } = elementHTML;

  return start + text + end;
}
