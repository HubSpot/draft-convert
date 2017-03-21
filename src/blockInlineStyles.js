import invariant from 'invariant';
import styleObjectFunction from './util/styleObjectFunction';
import accumulateFunction from './util/accumulateFunction';
import getElementHTML from './util/getElementHTML';
import rangeSort from './util/rangeSort';
import defaultInlineHTML from './default/defaultInlineHTML';

const subtractStyles = (original, toRemove) => {
  return original.filter(el => {
    return !toRemove.some(elToRemove => {
      return elToRemove.style === el.style;
    });
  });
};

const popEndingStyles = (styleStack, endingStyles) => {
  return endingStyles.reduceRight((stack, style) => {
    const styleToRemove = stack[stack.length - 1];

    invariant(
      styleToRemove.style === style.style,
      `Style ${styleToRemove.style} to be removed doesn't match expected ${style.style}`
    );

    return stack.slice(0, -1);
  }, styleStack);
};

const characterStyles = (offset, ranges) => {
  return ranges.filter(range => {
    return (offset >= range.offset && offset < (range.offset + range.length));
  });
};

const rangeIsSubset = (firstRange, secondRange) => {
  // returns true if the second range is a subset of the first
  const secondStartWithinFirst = firstRange.offset <= secondRange.offset;
  const secondEndWithinFirst = firstRange.offset + firstRange.length
                               >= secondRange.offset + secondRange.length;

  return secondStartWithinFirst && secondEndWithinFirst;
};

const latestStyleLast = (s1, s2) => {
  // make sure longer-lasting styles are added first
  const s2endIndex = s2.offset + s2.length;
  const s1endIndex = s1.offset + s1.length;
  return s2endIndex - s1endIndex;
};

const isPartiallyIntersectingMutation = (entities, style) => {
  // Check that style either starts from left of original offset and stops before end or
  // starts after beginning of original offset and stops beyond end
  // or start from left of original offset and stop after
  return entities.some(entityRange => {
    const leftIntersection = style.offset < entityRange.offset
      && style.offset + style.length < entityRange.offset + entityRange.length;
    const rightIntersection = style.offset > entityRange.offset
      && style.offset + style.length > entityRange.offset + entityRange.length;
    const leftToRightIntersection = style.offset < entityRange.offset
      && style.offset + style.length > entityRange.offset + entityRange.length;

    return leftIntersection || rightIntersection || leftToRightIntersection;
  });
};

const shouldResetStyles = (entities, remainingStyles, currentIndex, resetStyle) => {
  return entities.some(entityRange => {
    if (entityRange.prefixLength && entityRange.suffixLength) {
      // If the current index is at the start of beginning entity HTML tag or start of end entity HTML tag,
      // only want to close style
      if (currentIndex === entityRange.offset
        || currentIndex === entityRange.offset + entityRange.length - entityRange.suffixLength) {
        resetStyle.end = true;
        resetStyle.style = remainingStyles.slice(i);
        return true;
      }

      // If the current index is at the end of beginning entity HTML tag or end of end entity HTML tag,
      // only want to close style
      if (currentIndex === entityRange.offset + entityRange.prefixLength
        || currentIndex === entityRange.offset + entityRange.length) {
        resetStyle.start = true;
        resetStyle.style = remainingStyles.slice(i);
        return true;
      }
    }
  })
};

const getStylesToReset = (remainingStyles, newStyles, entities, currentIndex) => {
  const resetStyle = {
    style: []
  };

  let i = 0;
  while (i < remainingStyles.length) {
    if (isPartiallyIntersectingMutation(entities, remainingStyles[i])) {
      const shouldResetStyles = shouldResetStyles(entities, remainingStyles, currentIndex, resetStyle);
      if (shouldResetStyles) {
        return resetStyle;
      }
      i++;
    } else if (newStyles.every(rangeIsSubset.bind(null, remainingStyles[i]))) {
      i++;
    } else {
      return {
        start: true,
        end: true,
        style: remainingStyles.slice(i)
      };
    }
  }
  return resetStyle;
};

const appendStartMarkup = (inlineHTML, string, styleRange) => {
  return string + getElementHTML(inlineHTML(styleRange.style)).start;
};

const prependEndMarkup = (inlineHTML, string, styleRange) => {
  return getElementHTML(inlineHTML(styleRange.style)).end + string;
};

const defaultCustomInlineHTML = next => style => next(style);
defaultCustomInlineHTML.__isMiddleware = true;

export default (rawBlock, customInlineHTML = defaultCustomInlineHTML) => {
  invariant(
    rawBlock !== null && rawBlock !== undefined,
    'Expected raw block to be non-null'
  );


  let inlineHTML;
  if (customInlineHTML.__isMiddleware === true) {
    inlineHTML = customInlineHTML(defaultInlineHTML);
  } else {
    inlineHTML = accumulateFunction(
      styleObjectFunction(customInlineHTML),
      styleObjectFunction(defaultInlineHTML)
    );
  }

  let result = '';
  let styleStack = [];

  const sortedRanges = rawBlock.inlineStyleRanges.sort(rangeSort);
  const entities = rawBlock.entityRanges;

  for (let i = 0; i < rawBlock.text.length; i++) {
    const styles = characterStyles(i, sortedRanges);

    const endingStyles = subtractStyles(styleStack, styles);
    const newStyles = subtractStyles(styles, styleStack);
    const remainingStyles = subtractStyles(styleStack, endingStyles);

    // reset styles: look for any already existing styles that will need to
    // end before styles that are being added on this character. to solve this
    // close out those current tags and all nested children,
    // then open new ones nested within the new styles.
    const resetStyles = getStylesToReset(remainingStyles, newStyles, entities, i);

    // Determine whether or not you should reset a style.
    // If there is an custom entity to HTML elements, we only want to close the style
    // tag before the entity start of the tags and reopen it at the end of the tag.
    let newEndingStyleTags = endingStyles.concat();
    if (resetStyles.end) {
      newEndingStyleTags = endingStyles.concat(resetStyles.style);
    }
    const endingStyleTags = newEndingStyleTags.reduce(prependEndMarkup.bind(null, inlineHTML), '');


    let openingStyles = newStyles;
    if (resetStyles.start) {
      openingStyles = resetStyles.style.concat(newStyles).sort(latestStyleLast);
    }
    const openingStyleTags = openingStyles.reduce(appendStartMarkup.bind(null, inlineHTML), '');

    result += endingStyleTags + openingStyleTags + rawBlock.text[i];

    openingStyles = resetStyles.style.concat(newStyles).sort(latestStyleLast);

    styleStack = popEndingStyles(styleStack, resetStyles.style.concat(endingStyles));
    styleStack = styleStack.concat(openingStyles);

    invariant(
      styleStack.length === styles.length,
      `Character ${i}: ${styleStack.length - styles.length} styles left on stack that should no longer be there`
    );
  }

  result = styleStack.reduceRight((res, openStyle) => {
    return res + getElementHTML(inlineHTML(openStyle.style)).end;
  }, result);

  return result;
};
