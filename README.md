# **draft-convert**

[![npm version](https://badge.fury.io/js/draft-convert.svg)](https://www.npmjs.com/package/draft-convert) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

*Extensibly serialize & deserialize [**Draft.js**](http://draftjs.org/) content with HTML*

*See [**draft-extend**](http://github.com/HubSpot/draft-extend) for more on how to use draft-convert with plugins*

## Installation

`npm install draft-convert --save` or `yarn add draft-convert`

Jump to:

- [convertToHTML](#converttohtml)
- [convertFromHTML](#convertfromhtml)
- [Middleware functions](#middleware-functions)

## convertToHTML

**Extensibly serialize Draft.js [`ContentState`](http://facebook.github.io/draft-js/docs/api-reference-content-state.html#content) to HTML.**

**Basic usage:**
```javascript
const html = convertToHTML(editorState.getCurrentContent());
```
**Advanced usage:**
```javascript
// convert to HTML with blue text, paragraphs, and links
const html = convertToHTML({
  styleToHTML: (style) => {
    if (style === 'BOLD') {
      return <span style={{color: 'blue'}} />;
    }
  },
  blockToHTML: (block) => {
    if (block.type === 'PARAGRAPH') {
      return <p />;
    }
  },
  entityToHTML: (entity, originalText) => {
    if (entity.type === 'LINK') {
      return <a href={entity.data.url}>{originalText}</a>;
    }
    return originalText;
  }
})(editorState.getCurrentContent());

// convert content state to HTML with functionality defined in the plugins applied
const html = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
)(convertToHTML)(editorState.getCurrentContent());
```


`styleToHTML`, `blockToHtml`, and `entityToHTML` are functions that take Draft content data and may return a `ReactElement` or an object of shape `{start, end}`  defining strings for the beginning and end tags of the style, block, or entity. `entityToHTML` may return either a string with or without HTML if the use case demands it. `blockToHTML` also may return an optional `empty` property to handle alternative behavior for empty blocks. To use this along with a `ReactElement` return value an object of shape `{element: ReactElement, empty: ReactElement}` may be returned. If no additional functionality is necessary `convertToHTML` can be invoked with just a `ContentState` to serialize using just the default Draft functionality. `convertToHTML` can be passed as an argument to a plugin to modularly augment its functionality.

**Legacy alternative conversion options**
`styleToHTML` and `blockToHTML` options may be plain objects keyed by style or block type with values of `ReactElement` s or `{start, end}`  objects. These objects will eventually be removed in favor of the functions described above.

**Type info:**
```javascript
type ContentStateConverter = (contentState: ContentState) => string

type Tag =
  ReactElement |
  {start: string, end: string, empty?: string} |
  {element: ReactElement, empty?: ReactElement}

type RawEntity = {
    type: string,
    mutability: DraftEntityMutability,
    data: Object
}

type RawBlock = {
    type: string,
    depth: number,
    data?: object,
    text: string
}

type convertToHTML = ContentStateConverter | ({
    styleToHTML?: (style: string) => Tag,
    blockToHTML?: (block: RawBlock) => Tag),
    entityToHTML?: (entity: RawEntity, originalText: string) => Tag | string
}) => ContentStateConverter
```

## convertFromHTML

**Extensibly deserialize HTML to Draft.js [`ContentState`](http://facebook.github.io/draft-js/docs/api-reference-content-state.html#content).**

**Basic usage:**
```javascript
const editorState = EditorState.createWithContent(convertFromHTML(html));
```

**Advanced usage:**
```javascript
// convert HTML to ContentState with blue text, links, and at-mentions
const contentState = convertFromHTML({
    htmlToStyle: (nodeName, node, currentStyle) => {
        if (nodeName === 'span' && node.style.color === 'blue') {
            return currentStyle.add('BLUE');
        } else {
            return currentStyle;
        }
    },
    htmlToEntity: (nodeName, node, createEntity) => {
        if (nodeName === 'a') {
            return createEntity(
                'LINK',
                'MUTABLE',
                {url: node.href}
            )
        }
    },
    textToEntity: (text, createEntity) => {
        const result = [];
        text.replace(/\@(\w+)/g, (match, name, offset) => {
            const entityKey = createEntity(
                'AT-MENTION',
                'IMMUTABLE',
                {name}
            );
            result.push({
                entity: entityKey,
                offset,
                length: match.length,
                result: match
            });
        });
        return result;
    },
    htmlToBlock: (nodeName, node) => {
        if (nodeName === 'blockquote') {
            return {
                type: 'blockquote',
                data: {}
            };
        }
    }
})(html);

// convert HTML to ContentState with functionality defined in the draft-extend plugins applied
const fromHTML = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
)(convertFromHTML);
const contentState = fromHTML(html);
```

If no additional functionality is necessary `convertToHTML` can be invoked with just an HTML string to deserialize using just the default Draft functionality. Any `convertFromHTML` can be passed as an argument to a plugin to modularly augment its functionality. A `flat` option may be provided to force nested block elements to split into flat, separate blocks. For example, the HTML input `<p>line one<br />linetwo</p>` will produce two `unstyled` blocks in `flat` mode.

**Type info:**
```javascript
type HTMLConverter = (html: string, {flat: ?boolean}, DOMBuilder: ?Function, generateKey: ?Function) => ContentState

type EntityKey = string

type convertFromHTML = HTMLConverter | ({
    htmlToStyle: ?(nodeName: string, node: Node) => DraftInlineStyle,
    htmlToBlock: ?(nodeName: string, node: Node) => ?(DraftBlockType | {type: DraftBlockType, data: object} | false),
    htmlToEntity: ?(
        nodeName: string,
        node: Node,
        createEntity: (type: string, mutability: string, data: object) => EntityKey,
        getEntity: (key: EntityKey) => Entity,
        mergeEntityData: (key: string, data: object) => void,
        replaceEntityData: (key: string, data: object) => void
    ): ?EntityKey,
    textToEntity: ?(
        text: string,
        createEntity: (type: string, mutability: string, data: object) => EntityKey,
        getEntity: (key: EntityKey) => Entity,
        mergeEntityData: (key: string, data: object) => void,
        replaceEntityData: (key: string, data: object) => void
    ) => Array<{entity: EntityKey, offset: number, length: number, result: ?string}>
}) => HTMLConverter
```

## Middleware functions

Any conversion option for `convertToHTML`  or `convertFromHTML` may also accept a middleware function of shape `(next) => (…args) => result` , where `…args` are the normal configuration function paramaters and `result` is the expected return type for that function. These functions can transform results of the default conversion included in `convertToHTML` or `convertFromHTML` by leveraging the result of `next(...args)`. These middleware functions are most useful when passed as the result of composition of [`draft-extend`](http://github.com/HubSpot/draft-extend) plugins. If you choose to use them independently, a `__isMiddleware` property must be set to `true` on the function for `draft-convert` to properly handle it.

