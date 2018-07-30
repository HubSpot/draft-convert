import convertToHTML from '../../src/convertToHTML';
import React from 'react';
import { convertFromRaw } from 'draft-js';
import uniqueId from '../util/uniqueId';

/* eslint-disable react/no-multi-comp */

const buildContentBlock = ({
  type = 'unstyled',
  depth = 0,
  text = '',
  styleRanges = [],
  entityRanges = [],
  data = {},
}) => {
  return {
    text,
    type,
    data,
    depth,
    entityRanges,
    inlineStyleRanges: styleRanges,
    key: `test${uniqueId()}`,
  };
};

const buildContentState = (blocks, entityMap = {}) => {
  return convertFromRaw({
    entityMap,
    blocks: blocks.map(buildContentBlock),
  });
};

const styleMarkup = {
  BOLD: {
    start: '<b>',
    end: '</b>',
  },
  ITALIC: {
    start: '<i>',
    end: '</i>',
  },
  UNDERLINE: {
    start: '<u>',
    end: '</u>',
  },
};

describe('convertToHTML', () => {
  it('returns an empty div for an empty unstyled block', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '',
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p></p>');
  });

  it('uses empty state for an empty block', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '',
      },
    ]);

    const result = convertToHTML({
      blockToHTML: {
        unstyled: {
          start: '<p>',
          end: '</p>',
          empty: '<br>',
        },
      },
    })(contentState);

    expect(result).toBe('<br>');
  });

  it('applies inline styles to a block', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'this is bold',
        styleRanges: [
          {
            style: 'BOLD',
            offset: 8,
            length: 4,
          },
        ],
      },
    ]);
    const result = convertToHTML({
      styleToHTML: styleMarkup,
    })(contentState);
    expect(result).toBe('<p>this is <b>bold</b></p>');
  });

  it('applies paragraph block styles', () => {
    const contentState = buildContentState([
      {
        type: 'paragraph',
        text: 'test paragraph',
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>test paragraph</p>');
  });

  it('applies style to multiple blocks', () => {
    const contentState = buildContentState([
      {
        type: 'header-one',
        text: 'h1 block',
      },
      {
        type: 'header-two',
        text: 'h2 block',
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<h1>h1 block</h1><h2>h2 block</h2>');
  });

  it('applies styles for single list', () => {
    const contentState = buildContentState([
      {
        type: 'ordered-list-item',
        text: 'item one',
      },
      {
        type: 'ordered-list-item',
        text: 'item two',
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<ol><li>item one</li><li>item two</li></ol>');
  });

  it('nests list items of different depths', () => {
    const contentState = buildContentState([
      {
        type: 'unordered-list-item',
        text: 'top level',
        depth: 0,
      },
      {
        type: 'unordered-list-item',
        text: 'nested item',
        depth: 1,
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe(
      '<ul><li>top level</li><ul><li>nested item</li></ul></ul>'
    );
  });

  it('resets nesting when depth decreases', () => {
    const contentState = buildContentState([
      {
        type: 'unordered-list-item',
        text: 'top level',
        depth: 0,
      },
      {
        type: 'unordered-list-item',
        text: 'nested one level',
        depth: 1,
      },
      {
        type: 'unordered-list-item',
        text: 'nested two levels',
        depth: 2,
      },
      {
        type: 'unordered-list-item',
        text: 'back to top level',
        depth: 0,
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe(
      '<ul><li>top level</li><ul><li>nested one level</li><ul><li>nested two levels</li></ul></ul><li>back to top level</li></ul>'
    );
  });

  it('escapes HTML in text of blocks', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '<&>',
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>&lt;&amp;&gt;</p>');
  });

  it('escapes HTML in text of blocks before mutations', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '<&>test',
        styleRanges: [
          {
            style: 'BOLD',
            offset: 3,
            length: 4,
          },
        ],
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>&lt;&amp;&gt;<strong>test</strong></p>');
  });

  it('escapes HTML in text of blocks within mutations', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'te<&>st',
        styleRanges: [
          {
            style: 'BOLD',
            offset: 1,
            length: 5,
          },
        ],
      },
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>t<strong>e&lt;&amp;&gt;s</strong>t</p>');
  });

  it('escapes HTML in text of blocks before entities', () => {
    const contentState = buildContentState(
      [
        {
          type: 'unstyled',
          text: '<&>test',
          entityRanges: [
            {
              key: 0,
              offset: 3,
              length: 4,
            },
          ],
        },
      ],
      {
        0: {
          type: 'LINK',
          mutability: 'IMMUTABLE',
        },
      }
    );

    const result = convertToHTML({
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          return `<a>${originalText}</a>`;
        }
        return originalText;
      },
    })(contentState);
    expect(result).toBe('<p>&lt;&amp;&gt;<a>test</a></p>');
  });

  it('escapes HTML in text of blocks before entities', () => {
    const contentState = buildContentState(
      [
        {
          type: 'unstyled',
          text: 'te<&>st',
          entityRanges: [
            {
              key: 0,
              offset: 1,
              length: 5,
            },
          ],
          styleRanges: [
            {
              style: 'BOLD',
              offset: 6,
              length: 1,
            },
          ],
        },
      ],
      {
        0: {
          type: 'LINK',
          mutability: 'IMMUTABLE',
        },
      }
    );

    const result = convertToHTML({
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          return `<a>${originalText}</a>`;
        }
        return originalText;
      },
    })(contentState);
    expect(result).toBe('<p>t<a>e&lt;&amp;&gt;s</a><strong>t</strong></p>');
  });

  it('uses block metadata', () => {
    const contentState = buildContentState([
      {
        type: 'custom',
        text: 'test',
        data: {
          tagName: 'customtag',
          attribute: 'value',
        },
      },
    ]);

    const result = convertToHTML({
      blockToHTML: block => {
        if (block.type === 'custom') {
          const { tagName, attribute } = block.data;

          return {
            start: `<${tagName} attribute="${attribute}">`,
            end: `</${tagName}>`,
          };
        }
      },
    })(contentState);

    expect(result).toBe('<customtag attribute="value">test</customtag>');
  });

  describe('combine styles and entities', () => {
    const convertToHTMLProps = {
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          const { data } = entity;

          return {
            start: `<a href="${data.href}">`,
            end: '</a>',
          };
        }

        return originalText;
      },
    };

    it('combines styles and entities without overlap', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 0,
                length: 14,
                style: 'BOLD',
              },
              {
                offset: 14,
                length: 14,
                style: 'ITALIC',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 0,
                length: 28,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p><a href="http://google.com"><strong>overlapping st</strong><em>yles in entity</em></a></p>'
      );
    });

    it('combines overlapping styles and entities', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 0,
                length: 14,
                style: 'BOLD',
              },
              {
                offset: 12,
                length: 14,
                style: 'ITALIC',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 0,
                length: 28,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p><a href="http://google.com"><strong>overlapping </strong><em><strong>st</strong>yles in enti</em>ty</a></p>'
      );
    });

    it('combines styles and entities when intersecting with no style to left', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 0,
                length: 14,
                style: 'BOLD',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 12,
                length: 6,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p><strong>overlapping </strong><a href="http://google.com"><strong>st</strong>yles</a> in entity</p>'
      );
    });

    it('combines styles and entities when intersecting with no style text to right', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 14,
                length: 14,
                style: 'BOLD',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 12,
                length: 6,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p>overlapping <a href="http://google.com">st<strong>yles</strong></a><strong> in entity</strong></p>'
      );
    });

    it('correctly handles mutation containing another prefixed mutation', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping test Hello World',
            styleRanges: [
              {
                offset: 0,
                length: 11,
                style: 'BOLD',
              },
              {
                offset: 23,
                length: 5,
                style: 'ITALIC',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 17,
                length: 5,
              },
              {
                key: 1,
                offset: 23,
                length: 5,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
          1: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p><strong>overlapping</strong> test <a href="http://google.com">Hello</a> <em><a href="http://google.com">World</a></em></p>'
      );
    });

    it('combines styles and entities when intersection with no style text to right and left', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 0,
                length: 14,
                style: 'BOLD',
              },
              {
                offset: 16,
                length: 12,
                style: 'BOLD',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 12,
                length: 6,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);

      expect(result).toBe(
        '<p><strong>overlapping </strong><a href="http://google.com"><strong>st</strong>yl<strong>es</strong></a><strong> in entity</strong></p>'
      );
    });

    it('combines overlapping styles and entities when intersecting with no style', () => {
      const contentState = buildContentState(
        [
          {
            type: 'unstyled',
            text: 'overlapping styles in entity',
            styleRanges: [
              {
                offset: 0,
                length: 14,
                style: 'BOLD',
              },
              {
                offset: 10,
                length: 14,
                style: 'ITALIC',
              },
            ],
            entityRanges: [
              {
                key: 0,
                offset: 12,
                length: 6,
              },
            ],
          },
        ],
        {
          0: {
            type: 'LINK',
            mutability: 'IMMUTABLE',
            data: {
              href: 'http://google.com',
            },
          },
        }
      );

      const result = convertToHTML(convertToHTMLProps)(contentState);
      expect(result).toBe(
        '<p><strong>overlappin</strong><em><strong>g </strong><a href="http://google.com"><strong>st</strong>yles</a> in en</em>tity</p>'
      );
    });
  });

  it('allows specifying custom nested block types', () => {
    const convertToHTMLProps = {
      blockToHTML: block => {
        if (block.type === 'checkable-list-item') {
          return {
            element: <li data-checked={block.data.checked || false} />,
            nest: <ul />,
          };
        }
      },
    };

    const contentState = buildContentState([
      {
        type: 'checkable-list-item',
        text: 'item one',
        data: {
          checked: false,
        },
      },
      {
        type: 'checkable-list-item',
        text: 'item two',
        data: {
          checked: true,
        },
      },
    ]);
    const result = convertToHTML(convertToHTMLProps)(contentState);
    expect(result).toBe(
      '<ul><li data-checked="false">item one</li><li data-checked="true">item two</li></ul>'
    );
  });

  it('combines styles and entities without overlap using react to convert to HTML', () => {
    const contentState = buildContentState(
      [
        {
          type: 'unstyled',
          text: 'overlapping styles in entity',
          styleRanges: [
            {
              offset: 0,
              length: 14,
              style: 'BOLD',
            },
            {
              offset: 14,
              length: 14,
              style: 'ITALIC',
            },
          ],
          entityRanges: [
            {
              key: 0,
              offset: 0,
              length: 28,
            },
          ],
        },
      ],
      {
        0: {
          type: 'LINK',
          mutability: 'IMMUTABLE',
          data: {
            href: 'http://google.com',
          },
        },
      }
    );

    const result = convertToHTML({
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          const { data } = entity;

          return <a href={data.href} />;
        }

        return originalText;
      },
    })(contentState);

    expect(result).toBe(
      '<p><a href="http://google.com"><strong>overlapping st</strong><em>yles in entity</em></a></p>'
    );
  });

  it('uses JSX for block HTML', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'test',
      },
    ]);

    const html = convertToHTML({
      blockToHTML: block => {
        if (block.type === 'unstyled') {
          return <testelement />;
        }
      },
    })(contentState);

    expect(html).toBe('<testelement>test</testelement>');
  });

  it('uses JSX with style for block HTML', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'test',
        data: { align: 'right' },
      },
    ]);

    const html = convertToHTML({
      blockToHTML: block => {
        if (block.type === 'unstyled' && block.data.align) {
          return <p style={{ textAlign: block.data.align }} />;
        }
      },
    })(contentState);

    expect(html).toBe('<p style="text-align:right;">test</p>');
  });

  it('uses JSX for block HTML when passing a middleware function', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'test',
      },
    ]);

    const blockToHTML = next => block => {
      if (block.type === 'unstyled') {
        return <testelement />;
      }
      return next(block);
    };

    blockToHTML.__isMiddleware = true;

    const html = convertToHTML({ blockToHTML })(contentState);

    expect(html).toBe('<testelement>test</testelement>');
  });

  it('allows void elements to be result of blockToHTML', () => {
    const contentState = buildContentState([
      {
        type: 'image',
        text: 'test',
      },
    ]);

    const blockToHTML = block => {
      if (block.type === 'image') {
        return <img />;
      }
    };

    const html = convertToHTML({ blockToHTML })(contentState);

    expect(html).toBe('<img/>');
  });

  // '👍'.length === 2
  // '⛳'.length === 1
  it('handles emojis that count as two characters', () => {
    const contentState = buildContentState(
      [
        {
          text: '👍',
          type: 'unstyled',
          depth: 0,
          entityRanges: [
            {
              offset: 0,
              length: 1,
              key: 0,
            },
          ],
        },
      ],
      {
        0: {
          type: 'emoji',
          mutability: 'IMMUTABLE',
          data: {
            emojiUnicode: '👍',
          },
        },
      }
    );

    const result = convertToHTML({
      entityToHTML(entity, originalText) {
        if (entity.type === 'emoji') {
          return entity.data.emojiUnicode;
        }
      },
    })(contentState);

    expect(result).toBe('<p>👍</p>');
  });

  it('supports a string output for blockToHTML', () => {
    const contentState = buildContentState([
      {
        text: 'test',
        type: 'unstyled',
      },
    ]);

    const blockContents = '<div>unstyled block</div>';

    const result = convertToHTML({
      blockToHTML: block => {
        if (block.type === 'unstyled') {
          return blockContents;
        }
      },
    })(contentState);

    expect(result).toBe(blockContents);
  });

  it('handles overlapping entity and style', () => {
    const contentState = buildContentState(
      [
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          type: 'unstyled',
          entityRanges: [
            {
              offset: 0,
              length: 26,
              key: 0,
            },
          ],
          styleRanges: [
            {
              offset: 22,
              length: 34,
              style: 'ITALIC',
            },
          ],
        },
      ],
      {
        0: {
          type: 'LINK',
          mutability: 'IMMUTABLE',
          data: {},
        },
      }
    );

    const html = convertToHTML({
      styleToHTML: style => {
        if (style === 'ITALIC') {
          return <i />;
        }
      },
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          return <a href="http://test.com">{originalText}</a>;
        }
      },
    })(contentState);

    expect(html).toBe(
      '<p><a href="http://test.com">Lorem ipsum dolor sit <i>amet</i></a><i>, consectetur adipiscing elit.</i></p>'
    );
  });

  it('handles offset of entities after an emoji', () => {
    const contentState = buildContentState(
      [
        {
          text: '👍 Santi Albo',
          type: 'unstyled',
          depth: 0,
          entityRanges: [
            {
              offset: 0,
              length: 1,
              key: 0,
            },
            {
              offset: 2,
              length: 10,
              key: 1,
            },
          ],
        },
      ],
      {
        0: {
          type: 'emoji',
          mutability: 'IMMUTABLE',
          data: {
            emojiUnicode: '👍',
          },
        },
        1: {
          type: 'mention',
          mutability: 'SEGMENTED',
          data: {
            href: '/users/1',
          },
        },
      }
    );

    const result = convertToHTML({
      entityToHTML(entity, originalText) {
        if (entity.type === 'emoji') {
          return entity.data.emojiUnicode;
        } else if (entity.type === 'mention') {
          return <a href={entity.data.href}>{originalText}</a>; // <-- originalText here is "anti Albo"
        }
      },
    })(contentState);
    expect(result).toBe('<p>👍 <a href="/users/1">Santi Albo</a></p>');
  });

  it('handles offset of entities after an emoji with newline', () => {
    const contentState = buildContentState(
      [
        {
          text: '👍 \nSanti Albo',
          type: 'unstyled',
          depth: 0,
          entityRanges: [
            {
              offset: 0,
              length: 1,
              key: 0,
            },
            {
              offset: 3,
              length: 10,
              key: 1,
            },
          ],
        },
      ],
      {
        0: {
          type: 'emoji',
          mutability: 'IMMUTABLE',
          data: {
            emojiUnicode: '👍',
          },
        },
        1: {
          type: 'link',
          mutability: 'IMMUTABLE',
          data: {
            url: 'https://www.google.com',
          },
        },
      }
    );

    const result = convertToHTML({
      entityToHTML(entity, originalText) {
        if (entity.type === 'emoji') {
          return entity.data.emojiUnicode;
        } else if (entity.type === 'link') {
          return <a href={entity.data.url}>{originalText}</a>;
        }
      },
    })(contentState);
    expect(result).toBe(
      '<p>👍 <br/><a href="https://www.google.com">Santi Albo</a></p>'
    );
  });

  it('throws a meaningful error when no block definition exists', () => {
    const contentState = buildContentState([
      {
        type: 'test',
        text: 'asdf',
      },
    ]);

    expect(() => convertToHTML(contentState)).toThrowError(
      /missing HTML definition/
    );
  });
});
