# draft-convert
*Extensibly serialize & deserialize [Draft.js](http://draftjs.org) content with HTML*

*See [draft-extend](http://github.com/HubSpot/draft-extend) for more on how to use draft-convert with plugins*

Jump to:
- [convertToHTML](#converttohtml)
- [convertFromHTML](#convertfromhtml)

### `convertToHTML`
Extensibly serialize Draft.js [`ContentState`](http://facebook.github.io/draft-js/docs/api-reference-content-state.html#content) to HTML.

**Basic usage:**
```javascript
const html = convertToHTML(editorState.getCurrentContent());
```

**Advanced usage:**
```javascript
// convert to HTML with blue text, paragraphs, and links
const html = convertToHTML({
    styleToHTML: {
        'BLUE': {
            start: '<span style="color: blue">',
            end: '</span>'
        }
    },
    blockToHTML: {
        'PARAGRAPH': {
            start: '<p>',
            end: '</p>',
            empty: '<br>'
        }
    },
    entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
            return `<a href="${entity.data.url}">${originalText}</a>`;
        } else {
            return originalText;
        }
    }
})(editorState.getCurrentContent());

// convert content state to HTML with functionality defined in the plugins applied
const html = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
)(convertToHTML)(editorState.getCurrentContent());
```

`styleToHTML` and `blockToHtml` are objects keyed by `DraftInlineStyle` and `DraftBlockType` respectively and map
to beginning and ending tags to use. `blockToHTML` may also be a function receiving a raw block object that may inspect block metadata and returns an object with start and end strings. Blocks also have an optional `empty` property to handle alternative behavior for empty blocks. Both extend upon defaults that support the default style and block types. If no additional functionality is necessary `convertToHTML` can be invoked with just a `ContentState` to serialize using just the default Draft functionality. `convertToHTML` can be passed as an argument to a plugin to modularly augment its functionality.

**Type info:**
```
type TagObject = {
    [key: string]: {
        start: string,
        end: string,
        empty?: string
    }
}

type ContentStateConverter = (contentState: ContentState) => string

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
    styleToHTML: ?TagObject,
    blockToHTML: ?(TagObject | (block: RawBlock) => TagObject),
    entityToHTML: ?(entity: RawEntity, originalText: string) => string
}) => ContentStateConverter

```

### `convertFromHTML`
Extensibly deserialize HTML to Draft.js [`ContentState`](http://facebook.github.io/draft-js/docs/api-reference-content-state.html#content).

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
    htmlToEntity: (nodeName, node) => {
        if (nodeName === 'a') {
            return Entity.create(
                'LINK',
                'MUTABLE',
                {url: node.href}
            )
        }
    },
    textToEntity: (text) => {
        const result = [];
        text.replace(/\@(\w+)/g, (match, name, offset) => {
            const entityKey = Entity.create(
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

// convert HTML to ContentState with functionality defined in the plugins applied
const contentState = compose(
    FirstPlugin,
    SecondPlugin,
    ThirdPlugin
)(convertFromHTML);
```

If no additional functionality is necessary `convertToHTML` can be invoked with just an HTML string to deserialize using just the default Draft functionality. Any `convertFromHTML` can be passed as an argument to a plugin to modularly augment its functionality.

**Type info:**
```
type HTMLConverter = (html: string, DOMBuilder: ?Function) => ContentState

type EntityKey = string

type convertFromHTML = HTMLConverter | ({
    htmlToStyle: ?(nodeName: string, node: Node, currentStyle: DraftInlineStyle) => DraftInlineStyle,
    htmlToBlock: ?(nodeName: string, node: Node) => ?(DraftBlockType | {type: string, data: object}),
    htmlToEntity: ?(nodeName: string, node: string): ?EntityKey,
    textToEntity: ?(text) => Array<{entity: EntityKey, offset: number, length: number, result: ?string}>
}) => HTMLConverter
```
