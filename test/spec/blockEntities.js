import blockEntities from '../../src/blockEntities';
import blockInlineStyles from '../../src/blockInlineStyles';
import {convertFromRaw, convertToRaw} from 'draft-js';
import {Map} from 'immutable';

const buildRawBlock = (text, entityMap = {}, styleRanges = [], entityRanges = [], data = Map()) => {
  return convertToRaw(convertFromRaw({
    entityMap,
    blocks: [
      {
        text,
        depth: 0,
        data,
        entityRanges,
        inlineStyleRanges: styleRanges,
        type: 'unstyled',
        key: 'test'
      }
    ]
  })).blocks[0];
};

describe('blockEntities', () => {
  it('returns an empty string when no text is given', () => {
    const result = blockInlineStyles(
      blockEntities(
        buildRawBlock('', [])
      )
    );
    expect(result).toBe('');
  });

  it('converts a single entity to a string', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'newText'
        }
      }
    };

    const contentState = buildRawBlock('test', entityMap, [], [{
      key: 0,
      offset: 0,
      length: 4
    }]);
    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('newText');
  });

  it('converts two entities to strings using originalText', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
      }
    };

    const contentState = buildRawBlock('brackets nobrackets brackets', entityMap, [], [
      {
        key: 0,
        offset: 0,
        length: 8
      },
      {
        key: 0,
        offset: 20,
        length: 8
      }
    ]);
    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return `{${originalText}}`;
          }
          return originalText;
        }
      )
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
        mutability: 'IMMUTABLE'
      }
    };

    const contentState = buildRawBlock('bracketsbrackets', entityMap, [], [
      {
        key: 0,
        offset: 0,
        length: 8
      },
      {
        key: 1,
        offset: 8,
        length: 8
      }
    ]);

    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return `{${originalText}}`;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('{brackets}{brackets}');
  });

  it('converts an entity within a style', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz'
        }
      }
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 0,
          length: 5
        }
      ],
      [
        {
          key: 0,
          offset: 1,
          length: 3
        }
      ]
    );
    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('<strong>axyze</strong>');
  });

  it('converts an entity within a style with a length change', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz'
        }
      }
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 0,
          length: 5
        }
      ],
      [
        {
          key: 0,
          offset: 1,
          length: 2
        }
      ]
    );
    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('<strong>axyzde</strong>');
  });

  it('converts an entity before a style', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'xyz'
        }
      }
    };

    const contentState = buildRawBlock(
      'abcde',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 3,
          length: 2
        }
      ],
      [
        {
          key: 0,
          offset: 0,
          length: 2
        }
      ]
    );
    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('xyzc<strong>de</strong>');
  });

  it('adjusts styles with indices before the affecting entity index', () => {
    const entityMap = {
      0: {
        type: 'testEntity',
        mutability: 'IMMUTABLE',
        data: {
          test: 'abcde'
        }
      }
    };

    const contentState = buildRawBlock(
      'one two',
      entityMap,
      [
        {
          style: 'BOLD',
          offset: 4,
          length: 3
        }
      ],
      [
        {
          key: 0,
          offset: 0,
          length: 3
        },
        {
          key: 0,
          offset: 4,
          length: 3
        }
      ]
    );

    const result = blockInlineStyles(
      blockEntities(
        contentState,
        entityMap,
        (entity, originalText) => {
          if (entity.type === 'testEntity') {
            return entity.data.test;
          }
          return originalText;
        }
      )
    );
    expect(result).toBe('abcde <strong>abcde</strong>');
  });
});
