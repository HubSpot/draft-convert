import blockEntities from '../../src/blockEntities';
import blockInlineStyles from '../../src/blockInlineStyles';
import encodeBlock from '../../src/encodeBlock';
import { Map } from 'immutable';
import React from 'react';
import { convertFromRaw, convertToRaw } from 'draft-js';

const buildRawBlock = (
  text,
  entityMap = {},
  styleRanges = [],
  entityRanges = [],
  data = Map()
) => {
  return convertToRaw(
    convertFromRaw({
      entityMap,
      blocks: [
        {
          text,
          depth: 0,
          data,
          entityRanges,
          inlineStyleRanges: styleRanges,
          type: 'unstyled',
          key: 'test',
        },
      ],
    })
  ).blocks[0];
};

describe('blockEntities', () => {
  it('returns an empty string when no text is given', () => {
    const result = blockInlineStyles(blockEntities(buildRawBlock('', [])));
    expect(result).toBe('');
  });

  it('converts a single entity to a string', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'newText',
        },
      },
    };

    const contentState = buildRawBlock(
      'test',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 0,
          length: 4,
        },
      ]
    );
    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return entity.data.test;
        }
        return originalText;
      })
    );
    expect(result).toBe('newText');
  });

  it('converts two entities to strings using originalText', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
      },
    };

    const contentState = buildRawBlock(
      'brackets nobrackets brackets',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 0,
          length: 8,
        },
        {
          key: 0,
          offset: 20,
          length: 8,
        },
      ]
    );
    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return `{${originalText}}`;
        }
        return originalText;
      })
    );
    expect(result).toBe('{brackets} nobrackets {brackets}');
  });

  it('converts two adjacent entities', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
      },
      1: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
      },
    };

    const contentState = buildRawBlock(
      'bracketsbrackets',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 0,
          length: 8,
        },
        {
          key: 1,
          offset: 8,
          length: 8,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return `{${originalText}}`;
        }
        return originalText;
      })
    );
    expect(result).toBe('{brackets}{brackets}');
  });

  it('converts an entity within a style', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz',
        },
      },
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 0,
          length: 5,
        },
      ],
      [
        {
          key: 0,
          offset: 1,
          length: 3,
        },
      ]
    );
    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return entity.data.test;
        }
        return originalText;
      })
    );
    expect(result).toBe('<strong>axyze</strong>');
  });

  it('converts an entity within a style with a length change', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz',
        },
      },
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 0,
          length: 5,
        },
      ],
      [
        {
          key: 0,
          offset: 1,
          length: 2,
        },
      ]
    );
    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return entity.data.test;
        }
        return originalText;
      })
    );
    expect(result).toBe('<strong>axyzde</strong>');
  });

  it('converts an entity before a style', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz',
        },
      },
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 3,
          length: 2,
        },
      ],
      [
        {
          key: 0,
          offset: 0,
          length: 2,
        },
      ]
    );
    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return entity.data.test;
        }
        return originalText;
      })
    );
    expect(result).toBe('xyzc<strong>de</strong>');
  });

  it('adjusts styles with indices before the affecting entity index', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'abcde',
        },
      },
    };

    const contentState = buildRawBlock(
      'one two',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 4,
          length: 3,
        },
      ],
      [
        {
          key: 0,
          offset: 0,
          length: 3,
        },
        {
          key: 0,
          offset: 4,
          length: 3,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(contentState, entityMap, (entity, originalText) => {
        if (entity.type === 'testEntity') {
          return entity.data.test;
        }
        return originalText;
      })
    );
    expect(result).toBe('abcde <strong>abcde</strong>');
  });

  it('adjusts styles around the entity range', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: '{{ entity }}',
        },
      },
    };

    const rawBlock = buildRawBlock(
      "other'''''''text test's othertext",
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 17,
          length: 4,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        encodeBlock(rawBlock),
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }

          return originalText;
        }
      )
    );

    expect(result).toBe(
      'other&#x27;&#x27;&#x27;&#x27;&#x27;&#x27;&#x27;text {{ entity }}&#x27;s othertext'
    );
  });

  it('handles an empty ReactElement in entityToHTML', () => {
    const entityMap = {
      0: {
        type: 'test',
        mutability: 'IMMUTABLE',
        data: {
          test: 'test',
        },
      },
    };

    const rawBlock = buildRawBlock(
      'test link',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 5,
          length: 4,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        encodeBlock(rawBlock),
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'test') {
            return <a />;
          }

          return originalText;
        }
      )
    );

    expect(result).toBe('test <a>link</a>');
  });

  it('handles a ReactElement with a child in entityToHTML', () => {
    const entityMap = {
      0: {
        type: 'test',
        mutability: 'IMMUTABLE',
        data: {
          test: 'test',
        },
      },
    };

    const rawBlock = buildRawBlock(
      'test link',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 5,
          length: 4,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        encodeBlock(rawBlock),
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'test') {
            return <a>test</a>;
          }

          return originalText;
        }
      )
    );

    expect(result).toBe('test <a>test</a>');
  });

  it('handles an empty string in entityToHTML', () => {
    const entityMap = {
      0: {
        type: 'test',
        mutability: 'IMMUTABLE',
        data: {
          test: 'test',
        },
      },
    };

    const rawText = 'test link';
    const offset = 5;
    const length = 4;
    const rawBlock = buildRawBlock(
      rawText,
      entityMap,
      [],
      [
        {
          key: 0,
          offset,
          length,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        encodeBlock(rawBlock),
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'test') {
            return '';
          }

          return originalText;
        }
      )
    );

    const entitySubstring = rawText.slice(5, offset + length);
    const expected = rawText.replace(entitySubstring, '');
    expect(result).toBe(expected);
  });

  it('handles a start/end object in entityToHTML', () => {
    const entityMap = {
      0: {
        type: 'test',
        mutability: 'IMMUTABLE',
        data: {
          test: 'test',
        },
      },
    };

    const rawBlock = buildRawBlock(
      'test link',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 5,
          length: 4,
        },
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        encodeBlock(rawBlock),
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'test') {
            return {
              start: '<a>',
              end: '</a>',
            };
          }

          return originalText;
        }
      )
    );

    expect(result).toBe('test <a>link</a>');
  });

  it('handles a middleware function in entityToHTML', () => {
    const entityMap = {
      0: {
        type: 'test',
        mutability: 'IMMUTABLE',
        data: {
          test: 'test',
        },
      },
    };

    const rawBlock = buildRawBlock(
      'test link',
      entityMap,
      [],
      [
        {
          key: 0,
          offset: 5,
          length: 4,
        },
      ]
    );

    const middleware = next => (entity, originalText) => {
      if (entity.type === 'test') {
        return <a />;
      }

      return next(entity, originalText);
    };
    middleware.__isMiddleware = true;

    const result = blockInlineStyles(
      blockEntities(encodeBlock(rawBlock), entityMap, middleware)
    );

    expect(result).toBe('test <a>link</a>');
  });

  it('correctly updates overlapping style ranges', () => {
    const entityMap = {
      0: {
        type: 'LINK',
        mutability: 'IMMUTABLE',
        data: {},
      },
    };

    const rawBlock = buildRawBlock(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      entityMap,
      [
        {
          offset: 22,
          length: 34,
          style: 'ITALIC',
        },
      ],
      [
        {
          offset: 0,
          length: 26,
          key: 0,
        },
      ]
    );

    const updatedBlock = blockEntities(
      rawBlock,
      entityMap,
      (entity, originalText) => {
        if (entity.type === 'LINK') {
          return <a href="http://test.com">{originalText}</a>;
        }
      }
    );

    expect(updatedBlock.inlineStyleRanges.length).toBe(2);
  });

  it('allows void react elements as conversion results for entities', () => {
    const entityMap = {
      0: {
        type: 'IMAGE',
        mutability: 'IMMUTABLE',
        data: {},
      },
    };

    const rawBlock = buildRawBlock(' ', entityMap, null, [
      {
        offset: 0,
        length: 1,
        key: 0,
      },
    ]);

    const result = blockEntities(
      rawBlock,
      entityMap,
      (entity, originalText) => {
        if (entity.type === 'IMAGE') {
          return <img src="test" />;
        }
      }
    );

    expect(result.text).toBe('<img src="test"/>');
  });
});
