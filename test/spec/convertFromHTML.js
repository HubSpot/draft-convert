import React from 'react';
import { Entity, convertToRaw } from 'draft-js';
import convertFromHTML from '../../src/convertFromHTML';
import convertToHTML from '../../src/convertToHTML';

const customBlockToHTML = {
  unstyled: {
    start: '<p>',
    end: '</p>'
  }
};

describe('convertFromHTML', () => {
  const toContentState = (html, options) => {
    return convertFromHTML({
      htmlToBlock: (nodeName, node, lastList, inBlock) => {
        if ((nodeName === 'p' || nodeName === 'div') && inBlock === 'blockquote') {
          return 'blockquote';
        }

        if (nodeName === 'figure' && node.firstChild.nodeName === 'IMG') {
          return {
            type: 'atomic',
            data: {
              atomicType: 'image',
              src: node.firstChild.getAttribute('src')
            }
          };
        }

        if (nodeName === 'img' && inBlock !== 'atomic') {
          return 'atomic';
        }

        if (nodeName === 'header') {
          return 'header';
        }
      },
      htmlToStyle: (nodeName, node, inlineStyle) => {
        if (nodeName === 'span' && (node.style.fontFamily === 'Test' || node.style.fontFamily === "'Test'")) {
          return inlineStyle.add('FONT-TEST');
        }
        return inlineStyle;
      },
      htmlToEntity: (nodeName, node) => {
        if (nodeName === 'a' && node.href) {
          const href = node.href;
          return Entity.create('LINK', 'MUTABLE', { url: href });
        }

        if (nodeName === 'testnode') {
          return Entity.create('TEST', 'IMMUTABLE', {
            testAttr: node.getAttribute('test-attr')
          });
        }
        if (nodeName === 'img') {
          return Entity.create('IMAGE', 'IMMUTABLE', {
            src: node.getAttribute('src')
          });
        }
      },
      textToEntity: text => {
        const acc = [];
        const pattern = new RegExp('\\@\\w+', 'ig');
        let resultArray = pattern.exec(text);
        while (resultArray != null) {
          const name = resultArray[0].slice(1);
          acc.push({
            offset: resultArray.index,
            length: resultArray[0].length,
            entity: Entity.create(
              'AT-MENTION',
              'IMMUTABLE',
              { name }
            )
          });
          resultArray = pattern.exec(text);
        }
        text.replace(/\{\{\s*(\w+)\s*\}\}/gi, (match, tag, offset) => {
          acc.push({
            offset,
            length: match.length,
            result: tag,
            entity: Entity.create(
              'MERGE-TAG',
              'IMMUTABLE',
              { tag }
            )
          });
        });
        return acc;
      }
    })(html, options);
  };

  const testFixture = htmlFixture => {
    const contentState = toContentState(htmlFixture);
    const htmlOut = convertToHTML({
      styleToHTML: style => {
        if (style === 'FONT-TEST') {
          return <span style={{ fontFamily: 'Test' }} />;
        }
      },
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'TEST') {
          return `<testnode test-attr="${entity.data.testAttr}">${originalText}</testnode>`;
        } else if (entity.type === 'AT-MENTION') {
          return `@${entity.data.name}`;
        } else if (entity.type === 'MERGE-TAG') {
          return `{{ ${entity.data.tag} }}`;
        }
        return originalText;
      },
    })(contentState);
    expect(htmlOut).toBe(htmlFixture);
  };

  it('em', () => {
    testFixture('<p><em>Hello world!</em></p>');
  });

  it('ul', () => {
    testFixture('<ul><li>one</li><li>two</li><li>three</li></ul>');
  });

  it('nested inline styles - basic', () => {
    testFixture('<p><em><u>Boo</u></em></p>');
  });

  it('nested inline styles - staggered', () => {
    testFixture('<p><strong>draft<u>JS</u></strong></p>');
  });

  it('empty paragraphs', () => {
    const htmlFixture = '<p>one</p><p></p><p>two</p>';
    const state = convertFromHTML(htmlFixture);
    expect(state.blockMap.size).toBe(3);
    expect(state.blockMap.toList().get(1).text).toBe('');

    const htmlOut = convertToHTML({ blockToHTML: customBlockToHTML })(state);
    expect(htmlOut).toBe(htmlFixture);
  });

  it('basic link', () => {
    const htmlFixture = '<p><a href="http://hubspot.com/">HubSpot</a></p>';
    const state = toContentState(htmlFixture);
    expect(state.blockMap.first().characterList.first().entity).toBe('1');
    expect(state.blockMap.first().characterList.last().entity).toBe('1');

    const htmlOut = convertToHTML({
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
          return `<a href="${entity.data.url}">${originalText}</a>`;
        }
        return originalText;
      }
    })(state);
    expect(htmlOut).toBe(htmlFixture);
  });

  it('converts custom inline styles', () => {
    const html = '<p><span style="font-family:Test;">test font</span></p>';
    const contentState = toContentState(html);
    const styles = contentState.getFirstBlock().getInlineStyleAt(0);
    expect(styles.size).toBe(1);
    expect(styles.has('FONT-TEST')).toBe(true);

    testFixture(html);
  });

  it('ul - nested', () => {
    const htmlFixture = `
      <ul>
        <li>one</li>
        <li>two</li>
        <li>three</li>
        <ul>
            <li>sublist</li>
        </ul>
      </ul>`;
    const state = toContentState(htmlFixture);
    expect(state.blockMap.last().depth).toBe(1);  // failing, currently 0
  });

  it('ul with extra after', () => {
    testFixture('<ul><li>one</li><li>two</li><li>three</li></ul><p>Some more</p>');
  });

  it('ul with extra before', () => {
    testFixture('<p>Some leading content</p><ul><li>one</li><li>two</li><li>three</li></ul>');
  });

  it('converts custom entities from nodes', () => {
    testFixture('<p><testnode test-attr="asdf">text</testnode></p>');
  });

  it('converts custom entities from text', () => {
    testFixture('<p>test @ben at-mention</p>');
  });

  it('properly adjusts entity ranges for text entities that change length', () => {
    testFixture('<p>{{ tagone }} {{ tagtwo }}</p>');
  });

  it('includes empty blocks', () => {
    testFixture('<p>test1</p><p></p><p>test2</p>');
  });

  it('converts br tag to block boundaries when flat blocks are enabled', () => {
    const html = '<p>one<br/>two</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(2);
    expect(convertToHTML(contentState)).toBe('<p>one</p><p>two</p>');
  });

  it('DOESNT converts br tag to block boundaries', () => {
    const html = '<p>one<br/>two</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(1);
    expect(convertToHTML(contentState)).toBe('<p>one<br/>two</p>');
  });

  it('converts multiple consecutive brs', () => {
    const html = '<p>one<br/><br/>two</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(1);
    expect(convertToHTML(contentState)).toBe('<p>one<br/><br/>two</p>');
  });

  it('converts multiple consecutive brs to blocks when flat', () => {
    const html = '<p>one<br/><br/>two</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>one</p><p></p><p>two</p>');
  });

  it('handles brs at top level', () => {
    const html = '<p>one</p><br/><p>three</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>one</p><p></p><p>three</p>');
  });

  it('handles brs at top level when flat', () => {
    const html = '<p>one</p><br/><p>three</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>one</p><p></p><p>three</p>');
  });

  it('handles <p><br></p> and removes the BR', () => {
    const html = '<p>before</p><p><br></p><p>after</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p></p><p>after</p>');
  });

  it('handles <p><br></p>', () => {
    const html = '<p>before</p><p><br/></p><p>after</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p><br/></p><p>after</p>');
  });

  it('handles <p><strong><br><strong></p> and removes the BR when flat', () => {
    const html = '<p>before</p><p><strong><br></strong></p><p>after</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p></p><p>after</p>');
  });

  it('handles <p><strong><br><strong></p>', () => {
    const html = '<p>before</p><p><strong><br></strong></p><p>after</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p><br/></p><p>after</p>');
  });

  it('handles <div><br></div> when other semantic tags are also present and removes the BR when flat', () => {
    const html = '<div>before</div><div><br></div><p>after</p>';
    const contentState = toContentState(html, { flat: true });
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p></p><p>after</p>');
  });

  it('handles <div><br></div> when other semantic tags are also present', () => {
    const html = '<div>before</div><div><br></div><p>after</p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().length).toBe(3);
    expect(convertToHTML(contentState)).toBe('<p>before</p><p><br/></p><p>after</p>');
  });

  it('handles ul nested within block', () => {
    // this technically should be one big paragraph but the strategy to define
    // blocks will yield at least all but the first list item, so we should
    // yield all of them as list items instead.
    const html = '<p><ul><li>one</li><li>two</li></ul></p>';
    const contentState = toContentState(html);
    expect(contentState.getBlocksAsArray().filter(block => block.getType() === 'unordered-list-item').length).toBe(2);
  });

  it('converts custom block types while still using defaults', () => {
    const html = '<header>header</header><div>body</div>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(2);
    expect(blocks[0].getType()).toBe('header');
    expect(blocks[1].getType()).toBe('unstyled');
  });

  it('converts custom blocks and retains lists', () => {
    const html = '<header>header</header><ul><li>list</li></ul>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(2);
    expect(blocks[0].getType()).toBe('header');
    expect(blocks[1].getType()).toBe('unordered-list-item');
  });

  it('gracefully handles blocks without definitions', () => {
    const html = '<footer>footer</footer>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(1);
    expect(blocks[0].getType()).toBe('unstyled');
  });

  it('handles an image block', () => {
    const html = '<figure><img src="test" /></figure>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(1);
    expect(blocks[0].getType()).toBe('atomic');
    expect(blocks[0].characterList.size).toBe(1);
    const entityKey = blocks[0].characterList.first().entity;
    const entity = Entity.get(entityKey);
    expect(entity.getType()).toBe('IMAGE');
    expect(entity.getData().src).toBe('test');
  });

  it('handles an inline image', () => {
    const html = '<div>test<img src="test" />test</div>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(3);
    expect(blocks[1].getType()).toBe('atomic');
    expect(Entity.get(blocks[1].getEntityAt(0)).getType()).toBe('IMAGE');
    const resultHTML = convertToHTML({
      blockToHTML: {
        'atomic': {
          start: '<figure>',
          end: '</figure>'
        }
      },
      entityToHTML: (entity, originalText) => {
        if (entity.type === 'IMAGE') {
          return `<img src="${entity.data.src}" />`;
        }
        return originalText;
      }
    })(contentState);
    expect(resultHTML).toBe('<p>test</p><figure><img src="test" /></figure><p>test</p>');
  });

  it('handles only span and brs and all blocks are unstyled when flat', () => {
    const html = '<span>line one<br><br>line 3</span>';
    const contentState = toContentState(html, { flat: true });
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(3);
    blocks.forEach(block => {
      expect(block.getType()).toBe('unstyled');
    });
  });

  it('handles only span and brs and all blocks are unstyled', () => {
    const html = '<span>line one<br><br>line 3</span>';
    const contentState = toContentState(html);
    const blocks = contentState.getBlocksAsArray();
    expect(blocks.length).toBe(3);
    blocks.forEach(block => {
      expect(block.getType()).toBe('unstyled');
    });
  });

  it('unescapes HTML encoded characters in text and converts them back', () => {
    const html = '<p>test&amp;</p>';
    const contentState = toContentState(html);
    expect(contentState.getPlainText()).toBe('test&');
    const resultHTML = convertToHTML(contentState);
    expect(resultHTML).toBe(html);
  });

  it('handles nested blocks in blockquote', () => {
    const html = '<blockquote><p>test</p><p>test</p></blockquote>';
    const contentState = toContentState(html);
    contentState.getBlocksAsArray().forEach(block => {
      expect(block.getType()).toBe('blockquote');
    });
  });

  it('handles and persists block metadata', () => {
    const html = '<figure><img src="testimage"></figure>';
    const contentState = toContentState(html);
    const block = contentState.getBlocksAsArray()[0];
    expect(block.getType()).toBe('atomic');
    expect(block.getData().get('atomicType')).toBe('image');
    expect(block.getData().get('src')).toBe('testimage');
  });

  it('handles undefined nested block types', () => {
    const html = '<div><div>This won\'t work, first line</div></div>';
    const contentState = toContentState(html);
    const block = contentState.getBlocksAsArray()[0];
    expect(block.getType()).toBe('unstyled');
  });

  it('handles middleware functions when converting blocks from HTML', () => {
    const html = '<p>test</p>';
    const htmlToBlock = next => (nodeName, ...args) => {
      if (nodeName === 'p') {
        const block = next(nodeName, args);
        if (typeof block === 'string') {
          return {
            type: block,
            data: {
              test: true
            }
          };
        }
      }
    };
    htmlToBlock.__isMiddleware = true;

    const contentState = convertFromHTML({
      htmlToBlock
    })(html);

    const block = contentState.getBlocksAsArray()[0];
    expect(block.getData().get('test')).toBe(true);
  });

  it('handles middleware functions when converting entities from HTML', () => {
    const html = '<p><a>test</a></p>';
    const baseLink = next => nodeName => {
      if (nodeName === 'a') {
        return Entity.create('LINK', 'IMMUTABLE', {});
      }

      return next(...arguments);
    };
    const linkData = next => (nodeName, ...args) => {
      const entityKey = next(nodeName, ...args);
      if (nodeName === 'a') {
        Entity.mergeData(entityKey, { test: true });
        return entityKey;
      }

      return entityKey;
    };

    const htmlToEntity = (...args) => {
      return linkData(baseLink(...args));
    };
    htmlToEntity.__isMiddleware = true;

    const contentState = convertFromHTML({
      htmlToEntity
    })(html);

    const rawState = convertToRaw(contentState);
    expect(rawState.entityMap[0].type).toBe('LINK');
    expect(rawState.entityMap[0].data.test).toBe(true);
    expect(rawState.blocks[0].entityRanges[0].key).toBe(0);
  });

  it('handles middleware functions when converting entities from text', () => {
    const html = '<p>test1 test2</p>';
    const test1Search = next => text => {
      const results = next(text);
      text.replace(/test1/g, (match, offset) => {
        results.push({
          offset,
          length: match.length,
          entity: Entity.create('TEST1', 'IMMUTABLE', {})
        });
      });

      return results;
    };
    const test2Search = next => text => {
      const results = next(text);
      text.replace(/test2/g, (match, offset) => {
        results.push({
          offset,
          length: match.length,
          entity: Entity.create('TEST2', 'IMMUTABLE', {})
        });
      });

      return results;
    };

    const textToEntity = (...args) => {
      return test2Search(test1Search(...args));
    };
    textToEntity.__isMiddleware = true;

    const contentState = convertFromHTML({
      textToEntity
    })(html);

    const rawState = convertToRaw(contentState);
    expect(rawState.entityMap[0].type).toBe('TEST1');
    expect(rawState.entityMap[1].type).toBe('TEST2');
    expect(rawState.blocks[0].entityRanges[0].key).toBe(0);
    expect(rawState.blocks[0].entityRanges[1].key).toBe(1);
  });

  it('handles middleware functions when converting styles from HTML', () => {
    const html = '<p><strong>test</strong></p>';

    const htmlToStyle = next => (nodeName, ...args) => {
      const rest = next(nodeName, ...args);
      if (nodeName === 'strong' && rest.has('BOLD')) {
        return rest.map(style => {
          return style === 'BOLD' ? 'BOLD2' : 'BOLD';
        });
      }

      return rest;
    };

    htmlToStyle.__isMiddleware = true;

    const contentState = convertFromHTML({
      htmlToStyle
    })(html);

    const rawState = convertToRaw(contentState);
    expect(rawState.blocks[0].inlineStyleRanges[0].style).toBe('BOLD2');
  });
});
