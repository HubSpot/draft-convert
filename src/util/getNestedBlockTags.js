// @flow

import invariant from 'invariant';
import React from 'react';
import splitReactElement from './splitReactElement';

import type { BlockTagObject } from '../flow/Markup';

export function getNestStart(blockHTML: string | BlockTagObject): string {
  if (typeof blockHTML === 'object' && blockHTML.nestStart) {
    return blockHTML.nestStart;
  }

  return '';
}

export function getNestEnd(blockHTML: string | BlockTagObject): string {
  if (typeof blockHTML === 'object' && blockHTML.nestEnd) {
    return blockHTML.nestEnd;
  }

  return '';
}

export function getNestedBlockTags<NestedBlockMarkup>(
  blockHTML: NestedBlockMarkup
): { nestStart: string, nestEnd: string } {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'getNestedBlockTags: expected block HTML value to be non-null'
  );

  if (blockHTML.nest && React.isValidElement(blockHTML.nest)) {
    const verifiedElement = ((blockHTML.nest: any): React.Element<any>);

    const splitElement = splitReactElement(verifiedElement);

    if (typeof splitElement === 'object') {
      const { start, end } = splitElement;
      return {
        nestStart: start,
        nestEnd: end
      };
    }

    throw new Error(
      'getNestedBlockTags: nested element must not be a void HTML element'
    );
  }

  if (
    blockHTML.nestStart &&
    typeof blockHTML.nestStart === 'string' &&
    blockHTML.nestEnd &&
    typeof blockHTML.nestEnd === 'string'
  ) {
    return {
      nestStart: blockHTML.nestStart,
      nestEnd: blockHTML.nestEnd
    };
  }

  throw new Error(
    'getNestedBlockTags: expected to receive block markup with either a nest property or nestStart and nestEnd strings'
  );
}
