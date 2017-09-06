import blockInlineStyles from '../../src/blockInlineStyles';
import React from 'react';
import { convertFromRaw, convertToRaw } from 'draft-js';

const buildRawBlock = (text, styleRanges) => {
  return convertToRaw(convertFromRaw({
    entityMap: {},
    blocks: [
      {
        text,
        data: {},
        depth: 0,
        entityRanges: [],
        inlineStyleRanges: styleRanges,
        type: 'unstyled',
        key: 'test'
      }
    ]
  })).blocks[0];
};

describe('blockInlineStyles', () => {
  it('returns an empty string when no text is given', () => {
    const result = blockInlineStyles(buildRawBlock('', []));
    expect(result).toBe('');
  });

  it('applies a single style to a string', () => {
    const contentState = buildRawBlock('test', [{
      style: 'BOLD',
      offset: 0,
      length: 4
    }]);
    const result = blockInlineStyles(contentState);
    expect(result).toBe('<strong>test</strong>');
  });

  it('applies two styles to an entire string', () => {
    const contentState = buildRawBlock('test', [
      {
        style: 'BOLD',
        offset: 0,
        length: 4
      },
      {
        style: 'ITALIC',
        offset: 0,
        length: 4
      }
    ]);
    const result = blockInlineStyles(contentState);
    expect(result).toBe('<strong><em>test</em></strong>');
  });

  it('applies overlapping styles to a string', () => {
    const contentState = buildRawBlock('abcde', [
      {
        style: 'BOLD',
        offset: 0,
        length: 3
      },
      {
        style: 'ITALIC',
        offset: 2,
        length: 3
      }
    ]);
    const result = blockInlineStyles(contentState);
    expect(result).toBe('<strong>ab</strong><em><strong>c</strong>de</em>');
  });

  it('applies multiple overlapping styles to a string', () => {
    const contentState = buildRawBlock('1234567890', [
      {
        style: 'UNDERLINE',
        offset: 0,
        length: 4
      },
      {
        style: 'ITALIC',
        offset: 0,
        length: 8
      },
      {
        style: 'BOLD',
        offset: 3,
        length: 3
      }
    ]);
    const result = blockInlineStyles(contentState);
    expect(result).toBe('<em><u>123</u><strong><u>4</u>56</strong>78</em>90');
  });

  it('applies a custom style defined with a ReactElement', () => {
    const contentState = buildRawBlock('12345', [
      {
        style: 'CUSTOM',
        offset: 2,
        length: 2
      }
    ]);
    const result = blockInlineStyles(contentState, style => {
      if (style === 'CUSTOM') {
        return <span />;
      }
    });
    expect(result).toBe('12<span>34</span>5');
  });

  it('applies custom styles defined in middleware', () => {
    const contentState = buildRawBlock('12345', [
      {
        style: 'CUSTOM',
        offset: 2,
        length: 2
      }
    ]);
    const middleware = next => style => {
      if (style === 'CUSTOM') {
        return <span />;
      }
    };
    middleware.__isMiddleware = true;
    const result = blockInlineStyles(contentState, middleware);
    expect(result).toBe('12<span>34</span>5');
  });

  it('applies custom styles defined in middleware', () => {
    const contentState = buildRawBlock('12345', [
      {
        style: 'BOLD',
        offset: 2,
        length: 2
      }
    ]);
    const middleware = next => style => {
      if (style === 'BOLD') {
        const element = next(style);
        return React.cloneElement(element, {
          'data-test': 'test'
        });
      }
    };
    middleware.__isMiddleware = true;
    const result = blockInlineStyles(contentState, middleware);
    expect(result).toBe('12<strong data-test="test">34</strong>5');
  });

  it('plays well with emoji', () => {
    const contentState = buildRawBlock('aaa😥aaa', [
      {
        style: 'BOLD',
        offset: 4,
        length: 2
      }
    ]);
    const result = blockInlineStyles(contentState);
    expect(result).toBe('aaa😥<strong>aa</strong>a');
  });
});
