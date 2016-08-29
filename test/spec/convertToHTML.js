import convertToHTML from '../../src/convertToHTML';
import {convertFromRaw} from 'draft-js';
import uniqueId from '../util/uniqueId';

const buildContentBlock = ({type = 'unstyled', depth = 0, text = '', styleRanges = [], entityRanges = [], data = {}}) => {
  return {
    text,
    type,
    data,
    depth,
    entityRanges,
    inlineStyleRanges: styleRanges,
    key: `test${uniqueId()}`
  };
};

const buildContentState = (blocks, entityMap = {}) => {
  return convertFromRaw({
    entityMap,
    blocks: blocks.map(buildContentBlock)
  });
};

const styleMarkup = {
  'BOLD': {
    start: '<b>',
    end: '</b>'
  },
  'ITALIC': {
    start: '<i>',
    end: '</i>'
  },
  'UNDERLINE': {
    start: '<u>',
    end: '</u>'
  }
};

describe('convertToHTML', () => {
  it('returns an empty div for an empty unstyled block', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: ''
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p></p>');
  });

  it('uses empty state for an empty block', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: ''
      }
    ]);

    const result = convertToHTML({
      blockToHTML: {
        'unstyled': {
          start: '<p>',
          end: '</p>',
          empty: '<br>'
        }
      }
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
            length: 4
          }
        ]
      }
    ]);
    const result = convertToHTML({
      styleToHTML: styleMarkup
    })(contentState);
    expect(result).toBe('<p>this is <b>bold</b></p>');
  });

  it('applies paragraph block styles', () => {
    const contentState = buildContentState([
      {
        type: 'paragraph',
        text: 'test paragraph'
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>test paragraph</p>');
  });

  it('applies style to multiple blocks', () => {
    const contentState = buildContentState([
      {
        type: 'header-one',
        text: 'h1 block'
      },
      {
        type: 'header-two',
        text: 'h2 block'
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<h1>h1 block</h1><h2>h2 block</h2>');
  });

  it('applies styles for single list', () => {
    const contentState = buildContentState([
      {
        type: 'ordered-list-item',
        text: 'item one'
      },
      {
        type: 'ordered-list-item',
        text: 'item two'
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<ol><li>item one</li><li>item two</li></ol>');
  });

  it('nests list items of different depths', () => {
    const contentState = buildContentState([
      {
        type: 'unordered-list-item',
        text: 'top level',
        depth: 0
      },
      {
        type: 'unordered-list-item',
        text: 'nested item',
        depth: 1
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<ul><li>top level</li><ul><li>nested item</li></ul></ul>');
  });

  it('resets nesting when depth decreases', () => {
    const contentState = buildContentState([
      {
        type: 'unordered-list-item',
        text: 'top level',
        depth: 0
      },
      {
        type: 'unordered-list-item',
        text: 'nested one level',
        depth: 1
      },
      {
        type: 'unordered-list-item',
        text: 'nested two levels',
        depth: 2
      },
      {
        type: 'unordered-list-item',
        text: 'back to top level',
        depth: 0
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<ul><li>top level</li><ul><li>nested one level</li><ul><li>nested two levels</li></ul></ul><li>back to top level</li></ul>');
  });

  it('escapes HTML in text of blocks', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '<&>'
      }
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
            length: 4
          }
        ]
      }
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
            length: 5
          }
        ]
      }
    ]);
    const result = convertToHTML(contentState);
    expect(result).toBe('<p>t<strong>e&lt;&amp;&gt;s</strong>t</p>');
  });

  it('escapes HTML in text of blocks before entities', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: '<&>test',
        entityRanges: [
          {
            key: 0,
            offset: 3,
            length: 4
          }
        ]
      }
    ], {
      0: {
        type: 'LINK',
        mutability: 'IMMUTABLE',
      }
    });

    const result = convertToHTML({entityToHTML: (entity, originalText) => {
      if (entity.type === 'LINK') {
        return `<a>${originalText}</a>`;
      }
      return originalText;
    }})(contentState);
    expect(result).toBe('<p>&lt;&amp;&gt;<a>test</a></p>');
  });

  it('escapes HTML in text of blocks before entities', () => {
    const contentState = buildContentState([
      {
        type: 'unstyled',
        text: 'te<&>st',
        entityRanges: [
          {
            key: 0,
            offset: 1,
            length: 5
          }
        ],
        styleRanges: [
          {
            style: 'BOLD',
            offset: 6,
            length: 1
          }
        ]
      }
    ], {
      0: {
        type: 'LINK',
        mutability: 'IMMUTABLE',
      }
    });

    const result = convertToHTML({entityToHTML: (entity, originalText) => {
      if (entity.type === 'LINK') {
        return `<a>${originalText}</a>`;
      }
      return originalText;
    }})(contentState);
    expect(result).toBe('<p>t<a>e&lt;&amp;&gt;s</a><strong>t</strong></p>');
  });

  it('uses block metadata', () => {
    const contentState = buildContentState([
      {
        type: 'custom',
        text: 'test',
        data: {
          tagName: 'customtag',
          attribute: 'value'
        }
      }
    ]);

    const result = convertToHTML({
      blockToHTML: (block) => {
        if (block.type === 'custom') {
          const {
            tagName,
            attribute
          } = block.data;

          return {
            start: `<${tagName} attribute="${attribute}">`,
            end: `</${tagName}>`
          };
        }
      }
    })(contentState);

    expect(result).toBe('<customtag attribute="value">test</customtag>');
  });
});
