import React from 'react';
import getBlockTags from '../../src/util/getBlockTags';

describe('getBlockTags', () => {
  it('accepts a start/end pair object', () => {
    const block = {
      start: '<p>',
      end: '</p>',
    };

    expect(getBlockTags(block)).toBe(block);
  });

  it('accepts an empty react element', () => {
    const block = <p />;
    const result = {
      start: '<p>',
      end: '</p>',
    };
    expect(getBlockTags(block)).toEqual(result);
  });

  it('accepts an empty react element with an empty option', () => {
    const block = {
      element: <p />,
      empty: <br />,
    };
    const result = {
      start: '<p>',
      end: '</p>',
      empty: <br />,
    };
    expect(getBlockTags(block)).toEqual(jasmine.objectContaining(result));
  });

  it('accepts a react element with children', () => {
    const block = <p>asdf</p>;
    const result = '<p>asdf</p>';
    expect(getBlockTags(block)).toBe(result);
  });
});
